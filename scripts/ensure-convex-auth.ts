/// <reference types="node" />
import { spawn } from "node:child_process";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const CONVEX_CLI_PATH = fileURLToPath(
  new URL("../node_modules/convex/bin/main.js", import.meta.url),
);

// The variables of a deployment without a hub client. The OAuth component needs all three, setupOauth
// accepts this loopback issuer, and the home page hides its Google button for this client id.
// Convex.SharedHubClient of @samebase/alchemy-convex gives the same values when it has no client.
const HUB_OFF_VALUES = {
  HUB_ISSUER: "http://127.0.0.1:1",
  HUB_CLIENT_ID: "no-hub",
  HUB_CLIENT_SECRET: "no-hub",
};

type RunResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type RunOptions = {
  env?: NodeJS.ProcessEnv;
  sensitive?: boolean;
  stdio?: "inherit" | "pipe";
};

type RunConvex = (args: string[], options?: RunOptions) => Promise<RunResult>;

export function buildConvexCliCommand(args: string[], options: RunOptions = {}) {
  const stdio: "inherit" | ["ignore", "pipe", "pipe"] =
    options.stdio === "pipe" ? ["ignore", "pipe", "pipe"] : "inherit";

  return {
    command: process.execPath,
    args: [CONVEX_CLI_PATH, ...args],
    spawnOptions: {
      env: options.env ?? process.env,
      stdio,
    },
  };
}

function runConvexCli(args: string[], options: RunOptions = {}) {
  return new Promise<RunResult>((resolve, reject) => {
    const command = buildConvexCliCommand(args, options);
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const child = spawn(command.command, command.args, command.spawnOptions);

    if (options.stdio === "pipe") {
      child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    }

    child.on("error", reject);
    child.on("close", (code) => {
      const result = {
        code: code ?? 1,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      };
      if (result.code === 0) {
        resolve(result);
        return;
      }

      const commandLabel = options.sensitive ? "convex env set" : `convex ${args.join(" ")}`;
      reject(new Error(`${commandLabel} failed with exit code ${result.code}`));
    });
  });
}

async function readConvexEnv(
  name: string,
  env: NodeJS.ProcessEnv,
  selectionArgs: string[],
  runConvex: RunConvex,
) {
  const result = await runConvex(["env", "get", name, ...selectionArgs], {
    env,
    stdio: "pipe",
  });
  if (result.code !== 0) {
    throw new Error(`Could not read Convex environment variable ${name}.`);
  }
  const value = result.stdout.trim();
  return value.length > 0 ? value : null;
}

async function readDeploymentUrl(
  env: NodeJS.ProcessEnv,
  selectionArgs: string[],
  runConvex: RunConvex,
) {
  const result = await runConvex(
    ["run", "--inline-query", "process.env.CONVEX_CLOUD_URL", ...selectionArgs],
    { env, stdio: "pipe" },
  );
  const url: unknown = result.code === 0 ? JSON.parse(result.stdout) : null;
  if (typeof url !== "string") {
    throw new Error("Could not read the URL of the selected Convex deployment.");
  }
  return url;
}

// The format of `npx @convex-dev/auth`: the auth component decodes the base64 PKCS#8 key and signs
// with the `kid` of the first key in the set.
function generateAuthKeys() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  });
  const privatePem = privateKey.export({ format: "pem", type: "pkcs8" });
  const publicJwk = publicKey.export({ format: "jwk" });
  return {
    AUTH_PRIVATE_KEY: Buffer.from(privatePem.toString()).toString("base64"),
    AUTH_JWKS: JSON.stringify({
      keys: [{ ...publicJwk, kid: randomUUID(), alg: "RS256", use: "sig" }],
    }),
  };
}

async function setConvexEnv(
  name: string,
  value: string,
  env: NodeJS.ProcessEnv,
  selectionArgs: string[],
  runConvex: RunConvex,
) {
  await runConvex(["env", "set", ...selectionArgs, "--", name, value], {
    env,
    sensitive: true,
  });
}

/**
 * Sets the off value of each hub variable that the deployment does not have, and nothing else: a
 * value that exists, such as the client that alchemy.run.ts wrote before this push, stays. A list
 * of names is one command for all three and reads no secret.
 */
export async function ensureHubVariables(
  env: NodeJS.ProcessEnv,
  selectionArgs: string[] = [],
  runConvex: RunConvex = runConvexCli,
) {
  const result = await runConvex(["env", "list", "--names-only", ...selectionArgs], {
    env,
    stdio: "pipe",
  });
  if (result.code !== 0) {
    throw new Error("Could not list the Convex environment variables.");
  }
  const names = new Set(result.stdout.split(/\r?\n/));
  for (const [name, value] of Object.entries(HUB_OFF_VALUES)) {
    if (!names.has(name)) {
      await setConvexEnv(name, value, env, selectionArgs, runConvex);
    }
  }
}

export async function ensureConvexAuth(
  env: NodeJS.ProcessEnv,
  runConvex: RunConvex = runConvexCli,
  production = false,
) {
  // The deploy scripts run this inside their build, after Convex creates the deployment. A deploy
  // key selects its own deployment; a preview key also needs the preview name, which
  // actions/preview takes from the pull request branch. Without a key, `production` follows a
  // signed-in `pnpm run deploy`, and Convex otherwise uses the development deployment.
  const deployKey = env["CONVEX_DEPLOY_KEY"];
  const selectionArgs: string[] = [];
  if (deployKey?.startsWith("preview:")) {
    const previewName = env["GITHUB_HEAD_REF"];
    if (!previewName) {
      throw new Error("A preview deploy key needs GITHUB_HEAD_REF, the name of its preview.");
    }
    selectionArgs.push("--preview-name", previewName);
  } else if (!deployKey && production) {
    selectionArgs.push("--prod");
  }

  // Inside `npx convex deploy --cmd`, VITE_CONVEX_URL is the deployment that the deploy targets.
  // A selection above that names another deployment stops here, before any read or write.
  const targetUrl = env["VITE_CONVEX_URL"];
  if (targetUrl !== undefined) {
    const selectedUrl = await readDeploymentUrl(env, selectionArgs, runConvex);
    if (selectedUrl !== targetUrl) {
      throw new Error(
        `Convex Auth setup selected ${selectedUrl}, but the deploy targets ${targetUrl}. Deploy through the GitHub workflows, a signed-in pnpm run deploy, or pnpm run deploy:dev.`,
      );
    }
  }
  const existingPrivateKey = await readConvexEnv("AUTH_PRIVATE_KEY", env, selectionArgs, runConvex);
  const existingJwks = await readConvexEnv("AUTH_JWKS", env, selectionArgs, runConvex);

  if (existingPrivateKey && existingJwks) {
    console.log("Convex Auth keys already configured.");
  } else if (existingPrivateKey || existingJwks) {
    throw new Error("AUTH_PRIVATE_KEY and AUTH_JWKS must be configured together.");
  } else {
    const keys = generateAuthKeys();
    await setConvexEnv("AUTH_PRIVATE_KEY", keys.AUTH_PRIVATE_KEY, env, selectionArgs, runConvex);
    await setConvexEnv("AUTH_JWKS", keys.AUTH_JWKS, env, selectionArgs, runConvex);
    console.log("Convex Auth keys configured.");
  }

  await ensureHubVariables(env, selectionArgs, runConvex);
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  await ensureConvexAuth(process.env, runConvexCli, process.argv.includes("--prod"));
}
