// Samebase source build: v1989
/// <reference types="node" />
import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

export function verifyCurrentBranchHead(
  env: NodeJS.ProcessEnv,
  readRemoteHead = (branch: string) => {
    const output = execFileSync(
      "git",
      ["ls-remote", "--exit-code", "origin", `refs/heads/${branch}`],
      { encoding: "utf8" },
    );
    const [remoteHead] = output.trim().split(/\s+/, 1);

    if (!remoteHead) {
      throw new Error(`Git did not return a head commit for ${branch}.`);
    }

    return remoteHead;
  },
  readCheckoutHead = () => execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
) {
  if (env["WORKERS_CI"] !== "1" && env["WORKERS_CI"] !== "true") {
    return;
  }

  const branch = env["WORKERS_CI_BRANCH"];

  if (!branch) {
    throw new Error("Workers Builds must provide WORKERS_CI_BRANCH before Convex deploys.");
  }

  // A manual Workers Build can identify the commit as a branch name, so use the checkout itself.
  const checkoutHead = readCheckoutHead();
  if (!checkoutHead) {
    throw new Error("Git did not return the checked-out commit for this Workers Build.");
  }

  const remoteHead = readRemoteHead(branch);

  if (remoteHead !== checkoutHead) {
    throw new Error(
      `Workers Build ${checkoutHead} is stale: ${branch} now points to ${remoteHead}. Convex was not deployed.`,
    );
  }
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  verifyCurrentBranchHead(process.env);
}
