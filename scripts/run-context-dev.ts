// Samebase starter dev launcher sha256:9a19ac6550a3a4deb0617663c683f9ef45e76462f5069f1a24e43faccba4f71c
// Samebase source build: v1989
/// <reference types="node" />
import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

export type WorktreeKind = "main" | "linked";

export function selectDevRunner(kind: WorktreeKind) {
  return kind === "main" ? "run-primary-dev.ts" : "run-worktree-dev.ts";
}

export function resolveWorktreeKind(cwd = process.cwd()): WorktreeKind {
  const result = spawnSync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-dir", "--git-common-dir"],
    {
      cwd,
      encoding: "utf8",
    },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error("Run the development command from inside a Git checkout.");
  }

  const [gitDir, gitCommonDir] = result.stdout.trim().split(/\r?\n/);
  if (!gitDir || !gitCommonDir) {
    throw new Error("Git did not return enough metadata to select a development mode.");
  }

  return gitDir === gitCommonDir ? "main" : "linked";
}

async function main() {
  const runnerPath = fileURLToPath(
    new URL(selectDevRunner(resolveWorktreeKind()), import.meta.url),
  );

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [runnerPath, ...process.argv.slice(2)], {
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Development startup failed with exit code ${code ?? 1}.`));
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
