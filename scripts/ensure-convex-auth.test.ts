import process from "node:process";

import { describe, expect, it, vi } from "vite-plus/test";

import { buildConvexCliCommand, ensureConvexAuth } from "./ensure-convex-auth.ts";

const previewEnv = {
  CONVEX_DEPLOY_KEY: "preview:team:project|secret",
  GITHUB_HEAD_REF: "nicu-preview-smoke",
};

const CLIENT_ID = "https://preview-1.convex.site/oauth-client.json";

/** A deployment that has both auth keys and the client id of its site. */
const configured = (args: string[]) => ({
  code: 0,
  stdout:
    args[2] === "process.env.CONVEX_SITE_URL"
      ? '"https://preview-1.convex.site"\n'
      : args[2] === "OAUTH_CLIENT_ID"
        ? CLIENT_ID
        : "configured",
  stderr: "",
});

describe("ensure-convex-auth", () => {
  it("runs the Convex JavaScript entrypoint through Node without a shell", () => {
    const command = buildConvexCliCommand(["env", "get", "AUTH_JWKS"], {
      env: {},
      stdio: "pipe",
    });

    expect(command.command).toBe(process.execPath);
    expect(command.args[0]).toMatch(/[\\/]node_modules[\\/]convex[\\/]bin[\\/]main\.js$/);
    expect(command.args.slice(1)).toEqual(["env", "get", "AUTH_JWKS"]);
    expect(command.spawnOptions).not.toHaveProperty("shell");
  });

  it("sets both auth keys when direct Convex reads return empty values", async () => {
    const calls: string[][] = [];

    await ensureConvexAuth({}, async (args) => {
      calls.push(args);
      return args[0] === "run" ? configured(args) : { code: 0, stdout: "", stderr: "" };
    });

    expect(calls.slice(0, 2)).toEqual([
      ["env", "get", "AUTH_PRIVATE_KEY"],
      ["env", "get", "AUTH_JWKS"],
    ]);
    expect(calls.slice(2, 4).map((args) => args.slice(0, 4))).toEqual([
      ["env", "set", "--", "AUTH_PRIVATE_KEY"],
      ["env", "set", "--", "AUTH_JWKS"],
    ]);
    expect(calls[2]?.[4]).toBeTruthy();
    expect(calls[3]?.[4]).toBeTruthy();
  });

  it("creates auth keys in the same named preview as the build", async () => {
    const calls: string[][] = [];
    await ensureConvexAuth(previewEnv, async (args) => {
      calls.push(args);
      return args[0] === "run" ? configured(args) : { code: 0, stdout: "", stderr: "" };
    });

    expect(calls.slice(0, 2)).toEqual([
      ["env", "get", "AUTH_PRIVATE_KEY", "--preview-name", "nicu-preview-smoke"],
      ["env", "get", "AUTH_JWKS", "--preview-name", "nicu-preview-smoke"],
    ]);
    expect(calls.slice(2, 4).map((args) => args.slice(0, 6))).toEqual([
      ["env", "set", "--preview-name", "nicu-preview-smoke", "--", "AUTH_PRIVATE_KEY"],
      ["env", "set", "--preview-name", "nicu-preview-smoke", "--", "AUTH_JWKS"],
    ]);
  });

  it("keeps existing preview auth keys on a rebuild", async () => {
    const runConvex = vi.fn(async (args: string[]) => configured(args));
    await ensureConvexAuth(previewEnv, runConvex);

    expect(runConvex.mock.calls).toHaveLength(4);
  });

  it("follows a signed-in production deploy without a key", async () => {
    const calls: string[][] = [];
    await ensureConvexAuth(
      {},
      async (args) => {
        calls.push(args);
        return configured(args);
      },
      true,
    );

    expect(calls).toEqual([
      ["env", "get", "AUTH_PRIVATE_KEY", "--prod"],
      ["env", "get", "AUTH_JWKS", "--prod"],
      ["run", "--inline-query", "process.env.CONVEX_SITE_URL", "--prod"],
      ["env", "get", "OAUTH_CLIENT_ID", "--prod"],
    ]);
  });

  it("lets a production deploy key select its deployment", async () => {
    const calls: string[][] = [];
    await ensureConvexAuth(
      { CONVEX_DEPLOY_KEY: "prod:team:project|secret" },
      async (args) => {
        calls.push(args);
        return configured(args);
      },
      true,
    );

    expect(calls).toEqual([
      ["env", "get", "AUTH_PRIVATE_KEY"],
      ["env", "get", "AUTH_JWKS"],
      ["run", "--inline-query", "process.env.CONVEX_SITE_URL"],
      ["env", "get", "OAUTH_CLIENT_ID"],
    ]);
  });

  it("checks that the selected deployment is the deploy target", async () => {
    const calls: string[][] = [];
    await ensureConvexAuth(
      { ...previewEnv, VITE_CONVEX_URL: "https://preview-1.convex.cloud" },
      async (args) => {
        calls.push(args);
        return args[2] === "process.env.CONVEX_CLOUD_URL"
          ? { code: 0, stdout: '"https://preview-1.convex.cloud"\n', stderr: "" }
          : configured(args);
      },
    );

    expect(calls).toEqual([
      [
        "run",
        "--inline-query",
        "process.env.CONVEX_CLOUD_URL",
        "--preview-name",
        "nicu-preview-smoke",
      ],
      ["env", "get", "AUTH_PRIVATE_KEY", "--preview-name", "nicu-preview-smoke"],
      ["env", "get", "AUTH_JWKS", "--preview-name", "nicu-preview-smoke"],
      [
        "run",
        "--inline-query",
        "process.env.CONVEX_SITE_URL",
        "--preview-name",
        "nicu-preview-smoke",
      ],
      ["env", "get", "OAUTH_CLIENT_ID", "--preview-name", "nicu-preview-smoke"],
    ]);
  });

  it("stops before any read when the selection names another deployment", async () => {
    const calls: string[][] = [];
    await expect(
      ensureConvexAuth(
        { VITE_CONVEX_URL: "https://preview-1.convex.cloud" },
        async (args) => {
          calls.push(args);
          return { code: 0, stdout: '"https://production-1.convex.cloud"\n', stderr: "" };
        },
        true,
      ),
    ).rejects.toThrow("but the deploy targets https://preview-1.convex.cloud");
    expect(calls).toEqual([["run", "--inline-query", "process.env.CONVEX_CLOUD_URL", "--prod"]]);
  });

  it("refuses a preview key without its preview name", async () => {
    const runConvex = vi.fn(async () => ({ code: 0, stdout: "", stderr: "" }));
    await expect(
      ensureConvexAuth({ CONVEX_DEPLOY_KEY: "preview:team:project|secret" }, runConvex),
    ).rejects.toThrow("GITHUB_HEAD_REF");
    expect(runConvex).not.toHaveBeenCalled();
  });

  it("does not replace auth keys when an environment read fails", async () => {
    const calls: string[][] = [];
    await expect(
      ensureConvexAuth(previewEnv, async (args) => {
        calls.push(args);
        return { code: 1, stdout: "", stderr: "Environment read failed" };
      }),
    ).rejects.toThrow("Could not read Convex environment variable AUTH_PRIVATE_KEY.");
    expect(calls).toEqual([
      ["env", "get", "AUTH_PRIVATE_KEY", "--preview-name", "nicu-preview-smoke"],
    ]);
  });

  it("sets the client id of the site when the deployment holds another one", async () => {
    const calls: string[][] = [];
    await ensureConvexAuth(
      {},
      async (args) => {
        calls.push(args);
        return args[2] === "OAUTH_CLIENT_ID"
          ? { code: 0, stdout: "https://old.convex.site/oauth-client.json", stderr: "" }
          : configured(args);
      },
      true,
    );

    expect(calls.at(-1)).toEqual(["env", "set", "--prod", "--", "OAUTH_CLIENT_ID", CLIENT_ID]);
  });
});
