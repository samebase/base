/// <reference types="node" />
import { spawn } from "node:child_process";
import process from "node:process";

const child = spawn("vp", ["run", "dev"], {
  env: {
    ...process.env,
    CONVEX_AGENT_MODE: "anonymous",
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Failed to start worktree dev mode: ${error.message}`);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 1);
});
