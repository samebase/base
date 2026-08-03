import { describe, expect, it } from "vite-plus/test";

import { selectCloudflareDeployPlan } from "./deploy-cloudflare.ts";

describe("deploy-cloudflare", () => {
  it("uses the application-only build for a local dry-run", () => {
    expect(
      selectCloudflareDeployPlan(["deploy", "--dry-run"], {
        CLOUDFLARE_WORKER_NAME: "example-app",
      }),
    ).toEqual({
      buildArgs: ["run", "build:app"],
      wranglerArgs: ["deploy", "--name", "example-app", "--dry-run"],
    });
  });

  it("uses the complete Cloudflare build before a local deploy", () => {
    expect(
      selectCloudflareDeployPlan(["preview"], {
        CLOUDFLARE_WORKER_NAME: "example-app",
      }),
    ).toEqual({
      buildArgs: ["run", "build:cloudflare"],
      wranglerArgs: ["versions", "upload", "--name", "example-app"],
    });
  });

  it("does not repeat the build during Workers Builds", () => {
    expect(
      selectCloudflareDeployPlan(["deploy"], {
        WORKERS_CI: "true",
        WRANGLER_CI_OVERRIDE_NAME: "connected-worker",
      }),
    ).toEqual({
      buildArgs: null,
      wranglerArgs: ["deploy", "--name", "connected-worker"],
    });
  });

  it("rejects Wrangler flags that can replace the connected Worker name", () => {
    const env = { CLOUDFLARE_WORKER_NAME: "example-app" };

    expect(() => selectCloudflareDeployPlan(["deploy", "--name", "other"], env)).toThrow(
      "Do not pass Wrangler --name/-n manually",
    );
    expect(() => selectCloudflareDeployPlan(["deploy", "--name=other"], env)).toThrow(
      "Do not pass Wrangler --name/-n manually",
    );
    expect(() => selectCloudflareDeployPlan(["deploy", "-n", "other"], env)).toThrow(
      "Do not pass Wrangler --name/-n manually",
    );
  });
});
