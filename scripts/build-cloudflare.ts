/// <reference types="node" />
import { spawn } from "node:child_process";
import process from "node:process";

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? 1}`));
    });
  });
}

const branch = process.env.WORKERS_CI_BRANCH;

if (!process.env.CONVEX_DEPLOY_KEY) {
  if (process.env.WORKERS_CI) {
    throw new Error("Set CONVEX_DEPLOY_KEY in Cloudflare Workers build variables.");
  }

  console.warn("CONVEX_DEPLOY_KEY is not set; building static assets without deploying Convex.");
  await run("vp", ["run", "build:app"]);
  process.exit(0);
}

if (branch && branch !== "main") {
  await run("vp", [
    "exec",
    "convex",
    "deploy",
    "--preview-name",
    branch,
    "--cmd",
    "vp run build:app",
  ]);
  process.exit(0);
}

await run("vp", ["exec", "convex", "deploy", "--cmd", "vp run build:app"]);
