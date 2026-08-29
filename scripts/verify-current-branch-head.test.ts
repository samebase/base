// Samebase source build: v1989
import { describe, expect, it } from "vite-plus/test";

import { verifyCurrentBranchHead } from "./verify-current-branch-head.ts";

describe("verify-current-branch-head", () => {
  it("accepts a manual build while its checkout is the branch head", () => {
    verifyCurrentBranchHead(
      {
        WORKERS_CI: "1",
        WORKERS_CI_BRANCH: "feature",
        WORKERS_CI_COMMIT_SHA: "feature",
      },
      (branch) => {
        expect(branch).toBe("feature");
        return "new";
      },
      () => "new",
    );
  });

  it("rejects a build after a newer commit reaches its branch", () => {
    expect(() =>
      verifyCurrentBranchHead(
        {
          WORKERS_CI: "1",
          WORKERS_CI_BRANCH: "feature",
        },
        () => "new",
        () => "old",
      ),
    ).toThrow("Convex was not deployed");
  });

  it("fails closed without Workers Builds branch identity", () => {
    expect(() =>
      verifyCurrentBranchHead(
        { WORKERS_CI: "1" },
        () => "new",
        () => "new",
      ),
    ).toThrow("WORKERS_CI_BRANCH");
  });

  it("fails closed without a checked-out commit", () => {
    expect(() =>
      verifyCurrentBranchHead(
        { WORKERS_CI: "1", WORKERS_CI_BRANCH: "feature" },
        () => "new",
        () => "",
      ),
    ).toThrow("checked-out commit");
  });

  it("skips the provider check during local deploy validation", () => {
    expect(() =>
      verifyCurrentBranchHead(
        {},
        () => "unused",
        () => "unused",
      ),
    ).not.toThrow();
  });
});
