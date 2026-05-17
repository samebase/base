/// <reference types="node" />
import { spawn } from "node:child_process";
import process from "node:process";

const PROD_CONVEX_DEPLOY_KEY = "PROD_CONVEX_DEPLOY_KEY";
const PREVIEW_CONVEX_DEPLOY_KEY = "PREVIEW_CONVEX_DEPLOY_KEY";

type DeployKeyName = typeof PROD_CONVEX_DEPLOY_KEY | typeof PREVIEW_CONVEX_DEPLOY_KEY;

function run(command: string, args: string[], env?: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
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

function isWorkersBuild() {
  return process.env.WORKERS_CI === "1" || process.env.WORKERS_CI === "true";
}

function readDeployKey(deployKeyName: DeployKeyName, branch: string) {
  const deployKey = process.env[deployKeyName];
  if (deployKey) {
    return deployKey;
  }

  throw new Error(`Set ${deployKeyName} in Cloudflare Workers build variables for ${branch}.`);
}

const branch = process.env.WORKERS_CI_BRANCH;

if (process.env.CONVEX_DEPLOY_KEY) {
  throw new Error(
    `Do not set CONVEX_DEPLOY_KEY in Cloudflare Workers build variables. Set ${PROD_CONVEX_DEPLOY_KEY} and ${PREVIEW_CONVEX_DEPLOY_KEY}; this script selects the right key by branch.`,
  );
}

if (!branch) {
  if (isWorkersBuild()) {
    throw new Error(
      "Set WORKERS_CI_BRANCH in Cloudflare Workers build variables to prevent unintended production Convex deploys.",
    );
  }

  if (process.env[PROD_CONVEX_DEPLOY_KEY] || process.env[PREVIEW_CONVEX_DEPLOY_KEY]) {
    throw new Error(
      `Set WORKERS_CI_BRANCH to choose ${PROD_CONVEX_DEPLOY_KEY} or ${PREVIEW_CONVEX_DEPLOY_KEY}, or unset both keys for a frontend-only local build.`,
    );
  }

  console.warn(
    `${PROD_CONVEX_DEPLOY_KEY} and ${PREVIEW_CONVEX_DEPLOY_KEY} are not set; building static assets without deploying Convex.`,
  );
  await run("vp", ["run", "build:app"]);
  process.exit(0);
}

if (branch !== "main") {
  await run(
    "vp",
    ["exec", "convex", "deploy", "--preview-create", branch, "--cmd", "vp run build:app"],
    {
      ...process.env,
      CONVEX_DEPLOY_KEY: readDeployKey(PREVIEW_CONVEX_DEPLOY_KEY, branch),
    },
  );
  process.exit(0);
}

await run("vp", ["exec", "convex", "deploy", "--cmd", "vp run build:app"], {
  ...process.env,
  CONVEX_DEPLOY_KEY: readDeployKey(PROD_CONVEX_DEPLOY_KEY, branch),
});
