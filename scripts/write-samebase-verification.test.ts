import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

const SCRIPT = fileURLToPath(new URL("./write-samebase-verification.ts", import.meta.url));

/** Runs the script on a new directory with `env` in place of this process's GitHub variables. */
function run(env: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), "samebase-verification-"));
  const { GITHUB_REPOSITORY_ID: _, ...rest } = process.env;
  const result = spawnSync(process.execPath, [SCRIPT, directory], {
    env: { ...rest, ...env },
    encoding: "utf8",
  });
  return { result, file: join(directory, "samebase-verification.json") };
}

describe("write-samebase-verification", () => {
  it("writes the repository id that GitHub Actions gives the run", () => {
    const { result, file } = run({ GITHUB_REPOSITORY_ID: "123456789" });

    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({ repository: "123456789" });
  });

  it("writes no file outside GitHub Actions, and does not fail", () => {
    const { result, file } = run({});

    expect(result.status).toBe(0);
    expect(existsSync(file)).toBe(false);
    expect(result.stdout).toContain("No GITHUB_REPOSITORY_ID");
  });
});
