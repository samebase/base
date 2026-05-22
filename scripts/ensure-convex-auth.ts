/// <reference types="node" />
import { spawn } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import process from "node:process";

const VP_COMMAND = process.platform === "win32" ? "vp.cmd" : "vp";

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

function runVp(args: string[], options: RunOptions = {}) {
  return new Promise<RunResult>((resolve, reject) => {
    const stdio = options.stdio ?? "inherit";
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const child = spawn(VP_COMMAND, args, {
      env: options.env ?? process.env,
      shell: process.platform === "win32",
      stdio: stdio === "pipe" ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    if (stdio === "pipe") {
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

      const commandLabel = options.sensitive
        ? "vp convex env set"
        : `${VP_COMMAND} ${args.join(" ")}`;
      reject(new Error(`${commandLabel} failed with exit code ${result.code}`));
    });
  });
}

async function readConvexEnv(name: string, env: NodeJS.ProcessEnv) {
  const result = await runVp(["exec", "convex", "env", "get", name], {
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

async function setConvexEnv(name: string, value: string, env: NodeJS.ProcessEnv) {
  await runVp(["exec", "convex", "env", "set", "--", name, value], {
    env,
    sensitive: true,
  });
}

async function main() {
  const env = process.env;
  const existingPrivateKey = await readConvexEnv("JWT_PRIVATE_KEY", env);
  const existingJwks = await readConvexEnv("JWKS", env);

  if (existingPrivateKey && existingJwks) {
    console.log("Convex Auth keys already configured.");
    return;
  }
  if (existingPrivateKey || existingJwks) {
    throw new Error("JWT_PRIVATE_KEY and JWKS must be configured together.");
  }

  const keys = generateAuthKeys();
  await setConvexEnv("JWT_PRIVATE_KEY", keys.JWT_PRIVATE_KEY, env);
  await setConvexEnv("JWKS", keys.JWKS, env);
  console.log("Convex Auth keys configured.");
}

await main();
