/// <reference types="node" />
import { spawn } from "node:child_process";
import process from "node:process";

const modes = {
  deploy: ["deploy"],
  preview: ["versions", "upload"],
} as const;

type Mode = keyof typeof modes;

function isMode(value: string | undefined): value is Mode {
  return value === "deploy" || value === "preview";
}

function readWorkerName() {
  const workerName = process.env.WRANGLER_CI_OVERRIDE_NAME ?? process.env.CLOUDFLARE_WORKER_NAME;

  if (!workerName) {
    throw new Error(
      [
        "Missing Cloudflare Worker name.",
        "Workers Builds provides WRANGLER_CI_OVERRIDE_NAME automatically.",
        "For local deploy checks, set CLOUDFLARE_WORKER_NAME.",
      ].join("\n"),
    );
  }

  if (!/^[a-zA-Z0-9-]+$/.test(workerName)) {
    throw new Error("Cloudflare Worker names can only contain letters, numbers, and dashes.");
  }

  return workerName;
}

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

const [modeArg, ...extraArgs] = process.argv.slice(2);

if (!isMode(modeArg)) {
  throw new Error("Usage: node ./scripts/deploy-cloudflare.ts <deploy|preview> [wrangler flags]");
}

const workerName = readWorkerName();
const isWorkersBuild = process.env.WORKERS_CI === "1" || process.env.WORKERS_CI === "true";

if (!isWorkersBuild) {
  await run("vp", ["run", "build:cloudflare"]);
}

await run("wrangler", [...modes[modeArg], "--name", workerName, ...extraArgs]);
