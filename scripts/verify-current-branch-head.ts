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
) {
  if (env.WORKERS_CI !== "1" && env.WORKERS_CI !== "true") {
    return;
  }

  const branch = env.WORKERS_CI_BRANCH;
  const commitSha = env.WORKERS_CI_COMMIT_SHA;

  if (!branch || !commitSha) {
    throw new Error(
      "Workers Builds must provide WORKERS_CI_BRANCH and WORKERS_CI_COMMIT_SHA before Convex deploys.",
    );
  }

  const remoteHead = readRemoteHead(branch);

  if (remoteHead !== commitSha) {
    throw new Error(
      `Workers Build ${commitSha} is stale: ${branch} now points to ${remoteHead}. Convex was not deployed.`,
    );
  }
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  verifyCurrentBranchHead(process.env);
}
