/// <reference types="node" />
import { spawn } from "node:child_process";
import process from "node:process";

const child = spawn(
  "vp",
  [
    "exec",
    "convex",
    "dev",
    "--start",
    "node ./scripts/ensure-convex-auth.ts && vp run dev:frontend",
  ],
  {
    shell: process.platform === "win32",
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
