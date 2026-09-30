// Samebase source build: v2064
import { describe, expect, it, vi } from "vite-plus/test";

import { main, selectConvexDeployPlan } from "./build-cloudflare.ts";

describe("build-cloudflare", () => {
  it("requires the Convex Preview key in Previews Base", () => {
    expect(() =>
      selectConvexDeployPlan({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "feature-branch" }),
    ).toThrow("Cloudflare Builds > Previews Base > Variables and secrets");
  });

  it("requires the Workers branch during Workers builds", () => {
    expect(() => selectConvexDeployPlan({ WORKERS_CI: "1" })).toThrow("Set WORKERS_CI_BRANCH");
  });

  it("deploys production from main", () => {
    expect(
      selectConvexDeployPlan({
        CONVEX_DEPLOY_KEY: "prod-key",
        WORKERS_CI: "1",
        WORKERS_CI_BRANCH: "main",
      }),
    ).toEqual({
      kind: "deploy",
      args: [
        "exec",
        "convex",
        "deploy",
        "--cmd",
        "vp run build:app && node ./scripts/verify-current-branch-head.ts",
      ],
    });
  });

  it("reuses the named Convex preview on non-main branches", () => {
    expect(
      selectConvexDeployPlan({
        CONVEX_DEPLOY_KEY: "preview-key",
        WORKERS_CI: "1",
        WORKERS_CI_BRANCH: "feature-branch",
      }),
    ).toEqual({
      kind: "previewDeploy",
      args: [
        "exec",
        "convex",
        "deploy",
        "--preview-name",
        "feature-branch",
        "--cmd",
        "vp run build:app && node ./scripts/verify-current-branch-head.ts",
      ],
    });
  });

  it("requires the production key with the least-privilege permission set", () => {
    expect(() => selectConvexDeployPlan({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" })).toThrow(
      "Use a Convex production deploy key with exactly deployment:deploy, deployment:env:view, deployment:env:write, and deployment:data:view.",
    );
  });

  it("keeps local builds frontend-only even with Cloudflare values present", async () => {
    const runCommand = vi.fn(async () => {});
    await main({ CONVEX_DEPLOY_KEY: "prod-key", WORKERS_CI_BRANCH: "main" }, runCommand);

    expect(runCommand).toHaveBeenCalledExactlyOnceWith(["run", "build:app"], {
      CONVEX_DEPLOY_KEY: undefined,
      WORKERS_CI_BRANCH: "main",
    });
  });
});
