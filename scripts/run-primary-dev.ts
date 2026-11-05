/// <reference types="node" />
// `pnpm run dev` in the main checkout and in a linked worktree (RFC 133). In order:
//
// 1. `convex init` when `.env.local` selects no deployment. It configures a deployment and pushes
//    nothing.
// 2. The off values of the three HUB_ variables on the selected deployment, when they are missing,
//    because the first push needs them.
// 3. The stage `dev-<slug>` of the stack in alchemy.run.ts, with the team and the project of the
//    selected deployment in CONVEX_TEAM_ID and CONVEX_PROJECT_ID: a cloud development deployment of
//    this checkout in that project, its push, and its client of the identity hub.
//    The slug is the user name in the main checkout and the directory name in a linked worktree.
// 4. `convex deployment select` of the stage's deployment, when it is not the selected one.
// 5. `convex dev`, which starts the frontend after its first push.
//
// No failure of steps 2 to 4 stops `convex dev`: the app then has guest sign-in.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

import { ensureHubVariables } from "./ensure-convex-auth.ts";

export type Checkout = "main" | "linked";

/** Runs a command with arguments, no shell, and resolves with its exit code and, with `capture`, its standard output. */
export type Run = (
  command: string,
  args: string[],
  options?: { env?: NodeJS.ProcessEnv; capture?: boolean },
) => Promise<{ code: number; stdout: string }>;

const runCommand: Run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const child = spawn(command, args, {
      env: options.env ?? process.env,
      stdio: ["inherit", options.capture ? "pipe" : "inherit", "inherit"],
    });
    // The captured output still reaches the terminal.
    child.stdout?.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      process.stdout.write(chunk);
    });
    child.once("error", reject);
    child.once("close", (code) =>
      resolve({ code: code ?? 1, stdout: Buffer.concat(chunks).toString("utf8") }),
    );
  });

/** The stage of this checkout: `dev-` and the slug of the user name or of the directory name. */
export function devStage(checkout: Checkout, cwd: string, username: string) {
  const name = checkout === "main" ? username : path.basename(cwd);
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `dev-${slug || "laptop"}`;
}

/** The kind and the name of the deployment that `.env.local` selects, such as `dev` and `happy-animal-123`. */
export function selectedDeployment(envLocal: Record<string, string>) {
  const value = envLocal["CONVEX_DEPLOYMENT"]?.trim();
  if (!value) {
    return undefined;
  }
  const colon = value.indexOf(":");
  return colon < 0
    ? { kind: "dev", name: value }
    : { kind: value.slice(0, colon), name: value.slice(colon + 1) };
}

/** The name of the deployment in the output of the stack, `{ url: '...', deployment: '<name>' }`. */
export function stackDeployment(stdout: string) {
  // The output can be colored: drop the escape sequences first.
  // oxlint-disable-next-line no-control-regex
  const plain = stdout.replace(/\u001b\[[0-9;]*m/g, "");
  return [...plain.matchAll(/deployment: '([a-z0-9-]+)'/g)].at(-1)?.[1];
}

function readEnvLocal(cwd: string) {
  try {
    return parseEnv(readFileSync(path.join(cwd, ".env.local"), "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

/** The Convex team and project of a deployment, as decimal ids. */
export type DeploymentOwner = { teamId: string; projectId: string };

/**
 * The team and the project of a cloud deployment, through the Convex Management API with
 * CONVEX_ACCESS_TOKEN or the Convex CLI login, as @samebase/alchemy-convex finds them. Undefined
 * when there is no credential or the API does not answer.
 */
async function ownerOfDeployment(name: string): Promise<DeploymentOwner | undefined> {
  try {
    const [{ Credentials, fromConfig }, Effect, Redacted] = await Promise.all([
      import("@samebase/alchemy-convex"),
      import("effect/Effect"),
      import("effect/Redacted"),
    ]);
    const token = await Effect.runPromise(
      Effect.gen(function* () {
        const credentials = yield* Credentials;
        if (!(yield* credentials.hasAccessToken)) {
          return undefined;
        }
        return (yield* credentials.accessToken).accessToken;
      }).pipe(Effect.provide(fromConfig())),
    );
    if (token === undefined) {
      return undefined;
    }
    const get = async (pathname: string) => {
      const response = await fetch(`https://api.convex.dev/v1/${pathname}`, {
        headers: { Authorization: `Bearer ${Redacted.value(token)}` },
      });
      return response.ok ? ((await response.json()) as Record<string, unknown>) : undefined;
    };
    const deployment = await get(`deployments/${encodeURIComponent(name)}`);
    const projectId = deployment?.["projectId"];
    if (typeof projectId !== "number") {
      return undefined;
    }
    const teamId = (await get(`projects/${projectId}`))?.["teamId"];
    return typeof teamId === "number"
      ? { teamId: String(teamId), projectId: String(projectId) }
      : undefined;
  } catch {
    return undefined;
  }
}

export type DevOptions = {
  checkout: Checkout;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  username?: string;
  /** Arguments for `convex dev`. */
  convexArgs?: string[];
  readEnvLocal?: (cwd: string) => Record<string, string>;
  ownerOfDeployment?: (name: string) => Promise<DeploymentOwner | undefined>;
  ensureHubVariables?: (env: NodeJS.ProcessEnv) => Promise<void>;
  run?: Run;
  log?: (line: string) => void;
};

/** Runs the steps of `pnpm run dev` and resolves with the exit code of `convex dev`. */
export async function runDev(options: DevOptions) {
  const {
    checkout,
    cwd = process.cwd(),
    env = process.env,
    username = os.userInfo().username,
    convexArgs = [],
    run = runCommand,
    log = console.log,
  } = options;
  const readSelection = () => selectedDeployment((options.readEnvLocal ?? readEnvLocal)(cwd));
  const vitePlus = fileURLToPath(import.meta.resolve("vite-plus/bin"));
  const alchemy = fileURLToPath(new URL("../node_modules/alchemy/bin/cli.js", import.meta.url));
  const convex = (args: string[], runEnv = env) =>
    run(process.execPath, [vitePlus, "exec", "convex", ...args], { env: runEnv });

  if (readSelection() === undefined) {
    await convex(["init"]);
  }

  // The first push needs the HUB_ variables. A value that exists stays.
  await (options.ensureHubVariables ?? ((runEnv) => ensureHubVariables(runEnv)))(env).catch(
    () => undefined,
  );

  const stage = devStage(checkout, cwd, username);
  // The stage's deployment goes into the project of the selected cloud deployment, so the stage
  // never creates a project. CONVEX_TEAM_ID, when set, names the team of the state.
  const selected = readSelection();
  const owner =
    selected !== undefined && ["dev", "prod", "preview"].includes(selected.kind)
      ? await (options.ownerOfDeployment ?? ownerOfDeployment)(selected.name)
      : undefined;
  const team =
    env["CONVEX_TEAM_ID"] ||
    (options.readEnvLocal ?? readEnvLocal)(cwd)["CONVEX_TEAM_ID"] ||
    owner?.teamId;

  if (owner === undefined || !team) {
    log(
      "Google sign-in skipped: no Convex project. Select a cloud deployment with npx convex deployment select dev, and run npx convex login.",
    );
  } else {
    const result = await run(process.execPath, [alchemy, "deploy", "--stage", stage, "--yes"], {
      env: { ...env, CONVEX_TEAM_ID: team, CONVEX_PROJECT_ID: owner.projectId },
      capture: true,
    }).catch(() => ({ code: 1, stdout: "" }));
    const deployment = result.code === 0 ? stackDeployment(result.stdout) : undefined;
    if (deployment === undefined) {
      log(`Google sign-in skipped: alchemy deploy --stage ${stage} failed.`);
    } else if (deployment !== readSelection()?.name) {
      const select = await convex(["deployment", "select", deployment]).catch(() => ({ code: 1 }));
      if (select.code !== 0) {
        log(`Could not select the deployment ${deployment} of stage ${stage}.`);
      }
    }
  }

  const dev = await convex(["dev", ...convexArgs, "--start", "vp run dev:frontend"]);
  return dev.code;
}

export async function runPrimaryDev(checkout: Checkout = "main") {
  try {
    process.exit(await runDev({ checkout, convexArgs: process.argv.slice(2) }));
  } catch (error) {
    console.error(
      `Failed to start dev mode: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runPrimaryDev();
}
