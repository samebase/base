/// <reference types="node" />
import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { ensureHubVariables } from "./ensure-convex-auth.ts";

const vitePlusEntrypoint = fileURLToPath(import.meta.resolve("vite-plus/bin"));

export async function runPrimaryDev() {
  // `convex dev` pushes as soon as it starts, and the push fails while a hub variable is missing.
  // A fresh clone has no deployment to set them on yet, so this fails and the run goes on: the first
  // `pnpm run deploy:dev` sets them (README, First run).
  await ensureHubVariables(process.env).catch(() => undefined);

  const child = spawn(
    process.execPath,
    [
      vitePlusEntrypoint,
      "exec",
      "convex",
      "dev",
      ...process.argv.slice(2),
      "--start",
      "vp run dev:frontend",
    ],
    {
      stdio: "inherit",
    },
  );

  child.on("error", (error) => {
    console.error(`Failed to start dev mode: ${error.message}`);
    process.exit(1);
  });

  child.on("close", (code) => {
    process.exit(code ?? 1);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runPrimaryDev();
}
