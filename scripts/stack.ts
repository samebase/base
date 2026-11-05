/// <reference types="node" />
// The names that alchemy.run.ts and scripts/dev-start.ts share: the stack and the app at the hub.
import { execFileSync } from "node:child_process";
import process from "node:process";

/**
 * The name of this app at the identity hub, set once. The hub derives the ID of each user from it,
 * so it must never change: a new name means new users.
 */
export const HUB_APP = "app";

/** The `owner/name` of a GitHub remote URL, https or SSH, or undefined. */
export function repositoryOfRemote(url: string) {
  return /[:/]([^/:]+\/[^/]+?)(?:\.git)?$/.exec(url.trim())?.[1];
}

/**
 * The GitHub repository, `owner/name`, which names the stack: GITHUB_REPOSITORY in Actions, else the
 * origin remote. Undefined when neither names one.
 */
export function stackName(env: NodeJS.ProcessEnv = process.env) {
  const repository = env["GITHUB_REPOSITORY"];
  if (repository !== undefined) {
    return repository;
  }
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return repositoryOfRemote(remote);
  } catch {
    return undefined;
  }
}
