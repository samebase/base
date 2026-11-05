import process from "node:process";

import { describe, expect, it } from "vite-plus/test";

import {
  devStage,
  type DevOptions,
  type Run,
  runDev,
  selectedDeployment,
  stackDeployment,
} from "./run-primary-dev.ts";

const SELECTED = { CONVEX_DEPLOYMENT: "dev:happy-animal-123" };
const STACK_OUTPUT =
  "{ url: 'https://brave-otter-456.convex.site', deployment: 'brave-otter-456' }\n";

/** The step of a call: `init`, `deploy`, `select`, `dev`, or the script's own name. */
function step(args: string[]) {
  if (args[1] === "deploy") return `alchemy deploy ${args.slice(2).join(" ")}`;
  return `convex ${args.slice(3).join(" ")}`;
}

/** Runs runDev with fakes and returns the steps in order and the printed lines. */
async function dev(
  options: Partial<DevOptions> & {
    envLocal?: Record<string, string>[];
    stack?: { code: number; stdout: string } | Error;
  } = {},
) {
  const steps: string[] = [];
  const lines: string[] = [];
  const envLocal = [...(options.envLocal ?? [SELECTED])];
  let stackEnv: NodeJS.ProcessEnv | undefined;
  const run: Run = async (command, args, runOptions) => {
    expect(command).toBe(process.execPath);
    steps.push(step(args));
    if (args[1] === "deploy") {
      stackEnv = runOptions?.env;
      if (options.stack instanceof Error) throw options.stack;
      return options.stack ?? { code: 0, stdout: STACK_OUTPUT };
    }
    // `convex init` and `convex deployment select` write .env.local.
    if (args.includes("init") || args.includes("select")) envLocal.shift();
    return { code: 0, stdout: "" };
  };
  const code = await runDev({
    checkout: "main",
    cwd: "/home/ana/apps/base",
    env: {},
    username: "Ana.Popescu",
    readEnvLocal: () => envLocal[0] ?? {},
    ownerOfDeployment: async () => ({ teamId: "38516", projectId: "777" }),
    ensureHubVariables: async () => {
      steps.push("hub variables");
    },
    run,
    log: (line) => lines.push(line),
    ...options,
  });
  return { code, steps, lines, stackEnv };
}

describe("run-primary-dev", () => {
  it("names the stage after the user in the main checkout and the directory in a worktree", () => {
    expect(devStage("main", "/home/ana/apps/base", "Ana.Popescu")).toBe("dev-ana-popescu");
    expect(devStage("linked", "/home/ana/base-worktrees/Fix_Login", "ana")).toBe("dev-fix-login");
    expect(devStage("main", "C:\\Users\\ana", "__")).toBe("dev-laptop");
  });

  it("reads the selected deployment and the stack's deployment", () => {
    expect(selectedDeployment(SELECTED)).toEqual({ kind: "dev", name: "happy-animal-123" });
    expect(selectedDeployment({ CONVEX_DEPLOYMENT: "anonymous:anonymous-agent" })).toEqual({
      kind: "anonymous",
      name: "anonymous-agent",
    });
    expect(selectedDeployment({})).toBeUndefined();
    expect(stackDeployment(`\u001b[32m${STACK_OUTPUT}\u001b[0m`)).toBe("brave-otter-456");
    expect(stackDeployment("Error: deploy failed")).toBeUndefined();
  });

  it("runs the stack, selects its deployment, then starts convex dev", async () => {
    const { code, steps, lines, stackEnv } = await dev({ envLocal: [SELECTED] });

    expect(code).toBe(0);
    expect(steps).toEqual([
      "hub variables",
      "alchemy deploy --stage dev-ana-popescu --yes",
      "convex deployment select brave-otter-456",
      "convex dev --start vp run dev:frontend",
    ]);
    expect(stackEnv?.["CONVEX_TEAM_ID"]).toBe("38516");
    expect(stackEnv?.["CONVEX_PROJECT_ID"]).toBe("777");
    expect(lines).toEqual([]);
  });

  it("runs convex init only when .env.local selects no deployment", async () => {
    const { steps } = await dev({ envLocal: [{}, SELECTED] });

    expect(steps[0]).toBe("convex init");
    expect(steps.filter((name) => name === "convex init")).toHaveLength(1);
  });

  it("selects nothing when the stack's deployment is the selected one", async () => {
    const { steps } = await dev({
      envLocal: [{ CONVEX_DEPLOYMENT: "dev:brave-otter-456" }],
    });

    expect(steps).not.toContain("convex deployment select brave-otter-456");
  });

  it("takes the team from CONVEX_TEAM_ID and the project from the selected deployment", async () => {
    const { stackEnv } = await dev({ env: { CONVEX_TEAM_ID: "my-team" } });

    expect(stackEnv?.["CONVEX_TEAM_ID"]).toBe("my-team");
    expect(stackEnv?.["CONVEX_PROJECT_ID"]).toBe("777");
  });

  it("skips the stack without a project and still starts convex dev", async () => {
    for (const options of [
      // An anonymous local backend has no project, even with a team.
      {
        env: { CONVEX_TEAM_ID: "my-team" },
        envLocal: [{ CONVEX_DEPLOYMENT: "anonymous:anonymous-agent" }],
      },
      // The Management API gives no answer, such as without a login.
      { ownerOfDeployment: async () => undefined },
    ]) {
      const { steps, lines } = await dev(options);

      expect(steps).toEqual(["hub variables", "convex dev --start vp run dev:frontend"]);
      expect(lines).toHaveLength(1);
    }
  });

  it("still starts convex dev when the stack fails or does not start", async () => {
    for (const stack of [{ code: 1, stdout: "" }, new Error("spawn failed")]) {
      const { steps, lines } = await dev({ stack });

      expect(steps.at(-1)).toBe("convex dev --start vp run dev:frontend");
      expect(steps).not.toContain("convex deployment select brave-otter-456");
      expect(lines).toEqual([
        "Google sign-in skipped: alchemy deploy --stage dev-ana-popescu failed.",
      ]);
    }
  });

  it("passes the arguments of pnpm run dev to convex dev", async () => {
    const { steps } = await dev({ convexArgs: ["--once"] });

    expect(steps.at(-1)).toBe("convex dev --once --start vp run dev:frontend");
  });
});
