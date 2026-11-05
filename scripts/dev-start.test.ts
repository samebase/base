import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { alchemyConvexEntry, devStart } from "./dev-start.ts";

const env = { GITHUB_REPOSITORY: "owner/name" };
const vitePlus = "/vite-plus/bin.js";

/** A package.json of alchemy-convex whose `bin` file exists, in a new directory. */
function installedPackage() {
  const directory = mkdtempSync(join(tmpdir(), "samebase-dev-start-"));
  mkdirSync(join(directory, "lib"));
  writeFileSync(join(directory, "lib", "cli.js"), "");
  writeFileSync(
    join(directory, "package.json"),
    JSON.stringify({ bin: { "alchemy-convex": "./lib/cli.js" } }),
  );
  return { directory, packageJson: pathToFileURL(join(directory, "package.json")) };
}

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
  vi.restoreAllMocks();
});

function setup() {
  const installed = installedPackage();
  directories.push(installed.directory);
  return installed;
}

describe("dev-start", () => {
  it("finds the installed alchemy-convex command", () => {
    const entry = alchemyConvexEntry();
    expect(entry).toMatch(/[\\/]@samebase[\\/]alchemy-convex[\\/]lib[\\/]cli\.js$/);
  });

  it("runs the hub step through Node, then the frontend", async () => {
    const { directory, packageJson } = setup();
    const calls: [string, string[]][] = [];

    const code = await devStart({
      env,
      alchemyConvexPackage: packageJson,
      vitePlus,
      run: async (command, args) => {
        calls.push([command, args]);
        return 0;
      },
    });

    expect(code).toBe(0);
    expect(calls).toEqual([
      [
        process.execPath,
        [
          join(directory, "lib", "cli.js"),
          "hub-client",
          "--shared",
          "--stack",
          "owner/name",
          "--app",
          "app",
          "--callback-path",
          "/auth/hub/callback",
        ],
      ],
      [process.execPath, [vitePlus, "run", "dev:frontend"]],
    ]);
  });

  it("starts the frontend when the hub step fails", async () => {
    const { packageJson } = setup();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const calls: string[][] = [];

    const code = await devStart({
      env,
      alchemyConvexPackage: packageJson,
      vitePlus,
      run: async (_command, args) => {
        calls.push(args);
        return args[0] === vitePlus ? 3 : 1;
      },
    });

    expect(code).toBe(3);
    expect(calls.map((args) => args[1])).toEqual(["hub-client", "run"]);
    expect(log.mock.calls).toEqual([
      ["Google sign-in skipped: alchemy-convex hub-client exited with code 1."],
    ]);
  });

  it("starts the frontend when the hub step cannot start", async () => {
    const { packageJson } = setup();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const run = vi.fn(async (_command: string, args: string[]) => {
      if (args[1] === "hub-client") {
        throw new Error("spawn ENOENT");
      }
      return 0;
    });

    expect(await devStart({ env, alchemyConvexPackage: packageJson, vitePlus, run })).toBe(0);
    expect(run).toHaveBeenCalledTimes(2);
    expect(log.mock.calls).toEqual([
      ["Google sign-in skipped: alchemy-convex hub-client did not start: spawn ENOENT."],
    ]);
  });

  it("starts the frontend without the alchemy-convex command", async () => {
    const { directory } = setup();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const run = vi.fn(async () => 0);

    const missing = pathToFileURL(join(directory, "missing", "package.json"));
    expect(await devStart({ env, alchemyConvexPackage: missing, vitePlus, run })).toBe(0);
    expect(run.mock.calls).toEqual([[process.execPath, [vitePlus, "run", "dev:frontend"]]]);
    expect(log.mock.calls).toHaveLength(1);
  });

  it("finds no command when the bin file is missing", () => {
    const { directory, packageJson } = setup();
    rmSync(join(directory, "lib"), { recursive: true });
    expect(alchemyConvexEntry(packageJson)).toBeUndefined();
  });
});
