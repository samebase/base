// Samebase source build: v1989
/// <reference types="node" />
import { spawn } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const CONVEX_CLI_PATH = fileURLToPath(
  new URL("../node_modules/convex/bin/main.js", import.meta.url),
);

type RunResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type RunOptions = {
  allowFailure?: boolean;
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
      if (result.code === 0 || options.allowFailure) {
        resolve(result);
        return;
      }

      const commandLabel = options.sensitive ? "convex env set" : `convex ${args.join(" ")}`;
      reject(new Error(`${commandLabel} failed with exit code ${result.code}`));
    });
  });
}

async function readConvexEnv(name: string, env: NodeJS.ProcessEnv, runConvex: RunConvex) {
  const result = await runConvex(["env", "get", name], {
    allowFailure: true,
    env,
    stdio: "pipe",
  });
  if (result.code !== 0) {
    return null;
  }
  const value = result.stdout.trim();
  return value.length > 0 ? value : null;
}

function normalizePrivateKey(privateKey: string | Buffer) {
  return privateKey.toString().trimEnd().replace(/\n/g, " ");
}

function generateAuthKeys() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  });
  const privatePem = privateKey.export({ format: "pem", type: "pkcs8" });
  const publicJwk = publicKey.export({ format: "jwk" });
  return {
    JWT_PRIVATE_KEY: normalizePrivateKey(privatePem),
    JWKS: JSON.stringify({ keys: [{ use: "sig", ...publicJwk }] }),
  };
}

async function setConvexEnv(
  name: string,
  value: string,
  env: NodeJS.ProcessEnv,
  runConvex: RunConvex,
) {
  await runConvex(["env", "set", "--", name, value], {
    env,
    sensitive: true,
  });
}

export async function ensureConvexAuth(
  env: NodeJS.ProcessEnv,
  runConvex: RunConvex = runConvexCli,
) {
  const existingPrivateKey = await readConvexEnv("JWT_PRIVATE_KEY", env, runConvex);
  const existingJwks = await readConvexEnv("JWKS", env, runConvex);

  if (existingPrivateKey && existingJwks) {
    console.log("Convex Auth keys already configured.");
    return;
  }
  if (existingPrivateKey || existingJwks) {
    throw new Error("JWT_PRIVATE_KEY and JWKS must be configured together.");
  }

  const keys = generateAuthKeys();
  await setConvexEnv("JWT_PRIVATE_KEY", keys.JWT_PRIVATE_KEY, env, runConvex);
  await setConvexEnv("JWKS", keys.JWKS, env, runConvex);
  console.log("Convex Auth keys configured.");
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  await ensureConvexAuth(process.env);
}
