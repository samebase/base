/// <reference types="node" />
import { spawn } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

const CONVEX_DEPLOY_KEY = "CONVEX_DEPLOY_KEY";
const PREVIEW_CONVEX_DEPLOY_KEY = "PREVIEW_CONVEX_DEPLOY_KEY";

type DeployKeyName = typeof CONVEX_DEPLOY_KEY | typeof PREVIEW_CONVEX_DEPLOY_KEY;
type ConvexDeployPlan =
  | {
      kind: "deploy";
      deployKey: string;
      deployKeyName: typeof CONVEX_DEPLOY_KEY;
      args: readonly string[];
    }
  | {
      kind: "previewDeploy";
      deployKey: string;
      deployKeyName: typeof PREVIEW_CONVEX_DEPLOY_KEY;
      args: readonly string[];
    }
  | {
      kind: "frontendOnly";
    };

function run(command: string, args: readonly string[], env?: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, [...args], {
      env,
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

function isEnabled(value: string | undefined) {
  return value === "1" || value === "true";
}

function isWorkersBuild(env: NodeJS.ProcessEnv) {
  return isEnabled(env.WORKERS_CI);
}

function readDeployKey(args: {
  env: NodeJS.ProcessEnv;
  deployKeyName: DeployKeyName;
  branch: string;
}) {
  const deployKey = args.env[args.deployKeyName];
  if (deployKey) {
    return deployKey;
  }

  if (args.deployKeyName === CONVEX_DEPLOY_KEY) {
    throw new Error(
      `Set ${CONVEX_DEPLOY_KEY} in Cloudflare Workers build variables for ${args.branch}. Use a Convex production deploy key with exactly deployment:deploy, deployment:env:view, deployment:env:write, and deployment:data:view.`,
    );
  }

  throw new Error(
    `Set ${PREVIEW_CONVEX_DEPLOY_KEY} in Cloudflare Workers build variables for ${args.branch}. Use a Convex project Preview deploy key.`,
  );
}

async function ensureConvexAuth(env: NodeJS.ProcessEnv) {
  await run("node", ["./scripts/ensure-convex-auth.ts"], env);
}

export function selectConvexDeployPlan(env: NodeJS.ProcessEnv): ConvexDeployPlan {
  const branch = env.WORKERS_CI_BRANCH;

  if (!branch) {
    if (isWorkersBuild(env)) {
      throw new Error(
        "Set WORKERS_CI_BRANCH in Cloudflare Workers build variables to prevent unintended production Convex deploys.",
      );
    }

    if (env[CONVEX_DEPLOY_KEY] || env[PREVIEW_CONVEX_DEPLOY_KEY]) {
      throw new Error(
        `Set WORKERS_CI_BRANCH to choose ${CONVEX_DEPLOY_KEY} or ${PREVIEW_CONVEX_DEPLOY_KEY}, or unset both keys for a frontend-only local build.`,
      );
    }

    return { kind: "frontendOnly" };
  }

  if (branch !== "main") {
    return {
      kind: "previewDeploy",
      deployKeyName: PREVIEW_CONVEX_DEPLOY_KEY,
      deployKey: readDeployKey({
        env,
        branch,
        deployKeyName: PREVIEW_CONVEX_DEPLOY_KEY,
      }),
      args: ["exec", "convex", "deploy", "--preview-name", branch, "--cmd", "vp run build:app"],
    };
  }

  return {
    kind: "deploy",
    deployKeyName: CONVEX_DEPLOY_KEY,
    deployKey: readDeployKey({
      env,
      branch,
      deployKeyName: CONVEX_DEPLOY_KEY,
    }),
    args: ["exec", "convex", "deploy", "--cmd", "vp run build:app"],
  };
}

export async function main(env: NodeJS.ProcessEnv = process.env) {
  const plan = selectConvexDeployPlan(env);

  if (plan.kind === "frontendOnly") {
    console.warn(
      `${CONVEX_DEPLOY_KEY} and ${PREVIEW_CONVEX_DEPLOY_KEY} are not set; building static assets without deploying Convex.`,
    );
    await run("vp", ["run", "build:app"]);
    return;
  }

  const convexEnv = {
    ...env,
    CONVEX_DEPLOY_KEY: plan.deployKey,
  };
  await run("vp", plan.args, convexEnv);
  await ensureConvexAuth(convexEnv);
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  await main();
}
