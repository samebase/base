// The stack has two kinds of stage:
//
// - `prod` is the production deployment of the Convex project of this repository. It owns the
//   project, and `alchemy destroy --stage prod` deletes the project with every deployment.
// - Any other stage, such as `pr-42` for a pull request, is a preview deployment named after the
//   stage, which `alchemy destroy` deletes.
//
// The push is the `deploy` script: convex-hosting builds the site, sets the Convex Auth keys and the
// client id of the site (scripts/ensure-convex-auth.ts), uploads the site, and pushes the functions.
//
// The stack is named after the repository, `owner/name`, and its Convex project after `name`. The
// state of every stage is in the `alchemy-state-store` project of the team, which Convex.state()
// creates on the first run. Every run needs the team token CONVEX_ACCESS_TOKEN, or a Convex CLI
// login (`npx convex login`) on a development machine; it mints the deploy keys itself. The token
// names its team; with the Convex CLI login, the team is the team of the deployment that .env.local
// selects.
//
// A stage deployed before the sign-in at login.samebase.com holds two rows of the sign-in at
// id.samebase.com. "IdentityHubClient" is gone from the stack, so this deploy deletes it with the
// provider of IdentityBroker.providers(): a preview's client at the broker too, and a production
// client only in state, because the broker refuses that delete. "Site" stays declared without
// `env`, so this deploy removes its three variables, and `retain`, so it never deletes the
// deployment. Once every stage ran this version, a later version can drop both.
import { execFileSync } from "node:child_process";
import * as Convex from "@samebase/alchemy-convex";
import * as IdentityBroker from "@samebase/identity-broker/alchemy";
import * as Alchemy from "alchemy";
import { adopt } from "alchemy/AdoptPolicy";
import * as Output from "alchemy/Output";
import * as RemovalPolicy from "alchemy/RemovalPolicy";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/** The GitHub repository, `owner/name`: GITHUB_REPOSITORY in Actions, else the origin remote. */
const repository =
  process.env["GITHUB_REPOSITORY"] ??
  /[:/]([^/:]+\/[^/]+?)(?:\.git)?$/.exec(
    execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim(),
  )?.[1];
if (repository === undefined) {
  throw new Error("Set GITHUB_REPOSITORY to owner/name: the origin remote names no repository.");
}

/** The Convex project of the repository: its `name`. */
const projectName = repository.slice(repository.indexOf("/") + 1);

export default Alchemy.Stack(
  repository,
  {
    providers: Layer.mergeAll(Convex.providers(), IdentityBroker.providers()),
    state: Convex.withRunRecord(Convex.state()),
  },
  Effect.gen(function* () {
    const { stage } = yield* Alchemy.Stack;
    const source = {
      path: "./convex",
      command: ["node", "--run", "deploy"],
      // The build inputs. The functions, package.json, and the lockfile are always hashed.
      include: ["src/**", "public/**", "scripts/**", "vite.config.ts", "tsconfig*.json"],
    } satisfies Convex.Source;

    // The stage `prod` owns the project, and `alchemy destroy --stage prod` deletes it with
    // every deployment. A preview stage reads the project from the state of `prod`.
    const project =
      stage === "prod"
        ? yield* Convex.Project("Project", { name: projectName }).pipe(RemovalPolicy.destroy())
        : yield* Convex.Project.ref("Project", { stage: "prod" });
    // Production stays with the project, which owns it: the row keeps the default removal policy
    // `retain`, and destroying the stage deletes the project. A deployment with code that is not in
    // state still stops here until --adopt. A preview goes with its stage. adopt(true) also takes
    // over a preview with the name of this stage that an interrupted run left behind.
    const deployment =
      stage === "prod"
        ? yield* Convex.Deployment("Deployment", { project, type: "prod", source })
        : yield* Convex.Deployment("Deployment", {
            project,
            type: "preview",
            name: stage,
            source,
          }).pipe(adopt(true), RemovalPolicy.destroy());
    // The hash of the push orders this after it: Convex refuses to remove what the old code requires.
    const afterPush = Output.all(deployment.projectId, deployment.hash);
    const site = { project: { projectId: Output.map(afterPush, ([projectId]) => projectId) } };
    yield* (
      stage === "prod"
        ? Convex.Deployment("Site", { ...site, type: "prod" })
        : Convex.Deployment("Site", { ...site, type: "preview", name: stage })
    ).pipe(adopt(true), RemovalPolicy.retain());

    return { url: deployment.siteUrl };
  }),
);
