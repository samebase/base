// Samebase source build: v1989
import process from "node:process";

import { describe, expect, it } from "vite-plus/test";

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
});
