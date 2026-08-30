// Samebase source build: v1997
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";

import { resolveWorktreeKind, selectDevRunner } from "./run-context-dev.ts";

describe("run-context-dev", () => {
  it("selects the primary runner for the main Git worktree", () => {
    expect(selectDevRunner("main")).toBe("run-primary-dev.ts");
  });

  it("selects the worktree runner for a linked Git worktree", () => {
    expect(selectDevRunner("linked")).toBe("run-worktree-dev.ts");
  });

  it("detects main and linked Git worktrees", () => {
    const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "samebase-base-run-dev-test-"));
    const mainWorktree = path.join(temporaryDirectory, "main");
    const linkedWorktree = path.join(temporaryDirectory, "linked");

    try {
      execFileSync("git", ["init", "--initial-branch=main", mainWorktree], { stdio: "pipe" });
      execFileSync(
        "git",
        [
          "-C",
          mainWorktree,
          "-c",
          "user.name=Samebase test",
          "-c",
          "user.email=test@samebase.com",
          "commit",
          "--allow-empty",
          "-m",
          "Initial commit",
        ],
        { stdio: "pipe" },
      );
      execFileSync("git", ["-C", mainWorktree, "worktree", "add", "--detach", linkedWorktree], {
        stdio: "pipe",
      });

      expect(resolveWorktreeKind(mainWorktree)).toBe("main");
      expect(resolveWorktreeKind(linkedWorktree)).toBe("linked");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
