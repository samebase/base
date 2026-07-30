/// <reference types="node" />
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const guardPath = fileURLToPath(new URL("./check-typescript-sources.ts", import.meta.url));

function createTemporaryRepo(): string {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "samebase-app-typescript-sources-test-"));
  execFileSync("git", ["init"], { cwd: repoRoot });
  return repoRoot;
}

function trackFile(repoRoot: string, filePath: string): void {
  const absolutePath = path.join(repoRoot, filePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, "", "utf8");
  execFileSync("git", ["add", filePath], { cwd: repoRoot });
}

function runGuard(repoRoot: string) {
  return spawnSync(process.execPath, [guardPath], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

describe("check-typescript-sources CLI", () => {
  it("accepts TypeScript and the exact generated JavaScript outputs", () => {
    const repoRoot = createTemporaryRepo();

    try {
      trackFile(repoRoot, "scripts/check.ts");
      trackFile(repoRoot, "convex/_generated/api.js");
      trackFile(repoRoot, "convex/_generated/server.js");

      const result = runGuard(repoRoot);
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("All tracked handwritten source files use TypeScript.");
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("rejects every handwritten JavaScript extension through the real CLI", () => {
    const repoRoot = createTemporaryRepo();
    const handwrittenPaths = [
      "scripts/manual.js",
      "scripts/manual.jsx",
      "scripts/manual.mjs",
      "scripts/manual.cjs",
      "scripts/manual.mts",
      "scripts/manual.cts",
    ];

    try {
      for (const filePath of handwrittenPaths) {
        trackFile(repoRoot, filePath);
      }

      const result = runGuard(repoRoot);
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      for (const filePath of handwrittenPaths) {
        expect(result.stderr).toContain(filePath);
      }
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("rejects generated-looking JavaScript outside the exact allowlist", () => {
    const repoRoot = createTemporaryRepo();

    try {
      trackFile(repoRoot, "convex/_generated/manual.js");
      trackFile(repoRoot, "scripts/tool.generated.js");

      const result = runGuard(repoRoot);
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("convex/_generated/manual.js");
      expect(result.stderr).toContain("scripts/tool.generated.js");
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
