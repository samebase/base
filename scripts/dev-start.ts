/// <reference types="node" />
// The `--start` command of `convex dev` (scripts/run-primary-dev.ts), so it runs after the first
// push of each dev start, in the main checkout and in a linked worktree. It asks Samebase's identity
// hub for a client of this checkout's development deployment with
// `alchemy-convex hub-client --shared`, which reads the app's initial access token from the state
// of stage `prod` (RFC 133), then starts the frontend. Before the first deploy to main there is no
// token, and the app has guest sign-in. No result of the hub step stops the frontend.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { HUB_APP, HUB_CALLBACK_PATH, stackName } from "./stack.ts";

const ALCHEMY_CONVEX_PACKAGE = new URL(
  "../node_modules/@samebase/alchemy-convex/package.json",
  import.meta.url,
);

/** Runs a command with the terminal of this process and resolves with its exit code. */
export type Run = (command: string, args: string[]) => Promise<number>;

const runInherit: Run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });

/**
 * The JavaScript file of the installed `alchemy-convex` command, from the `bin` of its package, or
 * undefined when it is not installed. Node runs it, so Windows needs no `.cmd` shim.
 */
export function alchemyConvexEntry(packageJson: URL = ALCHEMY_CONVEX_PACKAGE) {
  try {
    const { bin } = JSON.parse(readFileSync(packageJson, "utf8")) as {
      bin?: string | Record<string, string>;
    };
    const path = typeof bin === "string" ? bin : bin?.["alchemy-convex"];
    if (path === undefined) {
      return undefined;
    }
    const entry = fileURLToPath(new URL(path, packageJson));
    return existsSync(entry) ? entry : undefined;
  } catch {
    return undefined;
  }
}

type DevStartOptions = {
  env?: NodeJS.ProcessEnv;
  /** The package.json of @samebase/alchemy-convex. */
  alchemyConvexPackage?: URL;
  vitePlus?: string;
  run?: Run;
};

/** Runs the hub step, then the frontend, and resolves with the exit code of the frontend. */
export async function devStart(options: DevStartOptions = {}) {
  const {
    env = process.env,
    alchemyConvexPackage = ALCHEMY_CONVEX_PACKAGE,
    vitePlus = fileURLToPath(import.meta.resolve("vite-plus/bin")),
    run = runInherit,
  } = options;

  const stack = stackName(env);
  const alchemyConvex = alchemyConvexEntry(alchemyConvexPackage);
  if (stack === undefined) {
    console.log("Google sign-in skipped: the origin remote names no GitHub repository.");
  } else if (alchemyConvex === undefined) {
    console.log("Google sign-in skipped: run pnpm install for the alchemy-convex command.");
  } else {
    const result = await run(process.execPath, [
      alchemyConvex,
      "hub-client",
      "--shared",
      "--stack",
      stack,
      "--app",
      HUB_APP,
      "--callback-path",
      HUB_CALLBACK_PATH,
    ]).catch((error: unknown) => (error instanceof Error ? error.message : String(error)));
    if (result !== 0) {
      const reason =
        typeof result === "number" ? `exited with code ${result}` : `did not start: ${result}`;
      console.log(`Google sign-in skipped: alchemy-convex hub-client ${reason}.`);
    }
  }

  return run(process.execPath, [vitePlus, "run", "dev:frontend"]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await devStart());
}
