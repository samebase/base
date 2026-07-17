import { describe, expect, it } from "vitest";

import { verifyCurrentBranchHead } from "./verify-current-branch-head.ts";

describe("verify-current-branch-head", () => {
  it("accepts the build while its commit is the branch head", () => {
    verifyCurrentBranchHead(
      {
        WORKERS_CI: "1",
        WORKERS_CI_BRANCH: "feature",
        WORKERS_CI_COMMIT_SHA: "new",
      },
      (branch) => {
        expect(branch).toBe("feature");
        return "new";
      },
    );
  });

  it("rejects a build after a newer commit reaches its branch", () => {
    expect(() =>
      verifyCurrentBranchHead(
        {
          WORKERS_CI: "1",
          WORKERS_CI_BRANCH: "feature",
          WORKERS_CI_COMMIT_SHA: "old",
        },
        () => "new",
      ),
    ).toThrow("Convex was not deployed");
  });

  it("fails closed without Workers Builds commit identity", () => {
    expect(() =>
      verifyCurrentBranchHead({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "feature" }, () => "new"),
    ).toThrow("WORKERS_CI_COMMIT_SHA");
  });

  it("skips the provider check during local deploy validation", () => {
    expect(() => verifyCurrentBranchHead({}, () => "unused")).not.toThrow();
  });
});
