// Samebase source build: v2064
import process from "node:process";

import { describe, expect, it, vi } from "vite-plus/test";

import { buildConvexCliCommand, ensureConvexAuth } from "./ensure-convex-auth.ts";

describe("ensure-convex-auth", () => {
  it("runs the Convex JavaScript entrypoint through Node without a shell", () => {
    const command = buildConvexCliCommand(["env", "get", "JWKS"], {
      env: {},
      stdio: "pipe",
    });

    expect(command.command).toBe(process.execPath);
    expect(command.args[0]).toMatch(/[\\/]node_modules[\\/]convex[\\/]bin[\\/]main\.js$/);
    expect(command.args.slice(1)).toEqual(["env", "get", "JWKS"]);
    expect(command.spawnOptions).not.toHaveProperty("shell");
  });

  it("sets both auth keys when direct Convex reads return empty values", async () => {
    const calls: string[][] = [];

    await ensureConvexAuth({}, async (args) => {
      calls.push(args);
      return { code: 0, stdout: "", stderr: "" };
    });

    expect(calls.slice(0, 2)).toEqual([
      ["env", "get", "JWT_PRIVATE_KEY"],
      ["env", "get", "JWKS"],
    ]);
    expect(calls.slice(2).map((args) => args.slice(0, 4))).toEqual([
      ["env", "set", "--", "JWT_PRIVATE_KEY"],
      ["env", "set", "--", "JWKS"],
    ]);
    expect(calls[2]?.[4]).toBeTruthy();
    expect(calls[3]?.[4]).toBeTruthy();
  });

  it("creates auth keys in the same named preview as the build", async () => {
    const calls: string[][] = [];
    await ensureConvexAuth({ WORKERS_CI_BRANCH: "nicu-preview-smoke" }, async (args) => {
      calls.push(args);
      return { code: 0, stdout: "", stderr: "" };
    });

    expect(calls.slice(0, 2)).toEqual([
      ["env", "get", "JWT_PRIVATE_KEY", "--preview-name", "nicu-preview-smoke"],
      ["env", "get", "JWKS", "--preview-name", "nicu-preview-smoke"],
    ]);
    expect(calls.slice(2).map((args) => args.slice(0, 6))).toEqual([
      ["env", "set", "--preview-name", "nicu-preview-smoke", "--", "JWT_PRIVATE_KEY"],
      ["env", "set", "--preview-name", "nicu-preview-smoke", "--", "JWKS"],
    ]);
  });

  it("keeps existing preview auth keys on a rebuild", async () => {
    const runConvex = vi.fn(async () => ({ code: 0, stdout: "configured", stderr: "" }));
    await ensureConvexAuth({ WORKERS_CI_BRANCH: "nicu-preview-smoke" }, runConvex);

    expect(runConvex.mock.calls).toHaveLength(2);
  });

  it("does not replace auth keys when an environment read fails", async () => {
    const calls: string[][] = [];
    await expect(
      ensureConvexAuth({ WORKERS_CI_BRANCH: "nicu-preview-smoke" }, async (args) => {
        calls.push(args);
        return { code: 1, stdout: "", stderr: "Environment read failed" };
      }),
    ).rejects.toThrow("Could not read Convex environment variable JWT_PRIVATE_KEY.");
    expect(calls).toEqual([
      ["env", "get", "JWT_PRIVATE_KEY", "--preview-name", "nicu-preview-smoke"],
    ]);
  });
});
