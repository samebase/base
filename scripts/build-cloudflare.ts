// Samebase source build: v2064
/// <reference types="node" />
import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const CONVEX_DEPLOY_KEY = "CONVEX_DEPLOY_KEY";
const WORKERS_BUILD_COMMAND = "vp run build:app && node ./scripts/verify-current-branch-head.ts";
const vitePlusEntrypoint = fileURLToPath(import.meta.resolve("vite-plus/bin"));

type ConvexDeployPlan =
  | {
      kind: "deploy";
      args: readonly string[];
    }
  | {
      kind: "previewDeploy";
      args: readonly string[];
    }
  | {
      kind: "frontendOnly";
    };

function run(args: readonly string[], env?: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [vitePlusEntrypoint, ...args], {
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`vp ${args.join(" ")} failed with exit code ${code ?? 1}`));
    });
  });
}

function isEnabled(value: string | undefined) {
  return value === "1" || value === "true";
}

export function selectConvexDeployPlan(env: NodeJS.ProcessEnv): ConvexDeployPlan {
  if (!isEnabled(env["WORKERS_CI"])) {
    return { kind: "frontendOnly" };
  }

  const branch = env["WORKERS_CI_BRANCH"];
  if (!branch) {
    throw new Error(
      "Set WORKERS_CI_BRANCH in Cloudflare Workers build variables to prevent unintended production Convex deploys.",
    );
  }

  if (!env[CONVEX_DEPLOY_KEY]) {
    throw new Error(
      branch === "main"
        ? `Set ${CONVEX_DEPLOY_KEY} in Cloudflare production build variables. Use a Convex production deploy key with exactly deployment:deploy, deployment:env:view, deployment:env:write, and deployment:data:view.`
        : `Set ${CONVEX_DEPLOY_KEY} in Cloudflare Builds > Previews Base > Variables and secrets. Use a Convex project Preview deploy key.`,
    );
  }

  if (branch !== "main") {
    return {
      kind: "previewDeploy",
      args: ["exec", "convex", "deploy", "--preview-name", branch, "--cmd", WORKERS_BUILD_COMMAND],
    };
  }

  return {
    kind: "deploy",
    args: ["exec", "convex", "deploy", "--cmd", WORKERS_BUILD_COMMAND],
  };
}

export async function main(env: NodeJS.ProcessEnv = process.env, runCommand = run) {
  const plan = selectConvexDeployPlan(env);

  if (plan.kind === "frontendOnly") {
    await runCommand(["run", "build:app"], { ...env, CONVEX_DEPLOY_KEY: undefined });
    return;
  }

  await runCommand(plan.args, env);
  await runCommand(["exec", "node", "./scripts/ensure-convex-auth.ts"], env);
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  await main();
}
