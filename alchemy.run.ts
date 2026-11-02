// Stage `prod` is the production deployment of the Convex project of this
// repository. Any other stage, such as `pr-42` for a pull request, is a
// preview deployment named after the stage, which `alchemy destroy` deletes.
// The push is the `deploy` script: convex-hosting builds the site, sets the
// Convex Auth keys, uploads the site, and pushes the functions.
//
// The stack is named after the repository, `owner/name`, and its Convex
// project after `name`. The state of every stage is in the `alchemy-state-store`
// project of the team, which Convex.state() creates on the first run. Every
// run needs the team token CONVEX_ACCESS_TOKEN, or a Convex CLI login
// (`npx convex login`) on a laptop; it mints the deploy keys itself.
//
// Each deployment asks Samebase for a client of the identity hub, for Google sign-in, with the
// GitHub OIDC token of the run (`id-token: write` in the workflows). The client is on the
// deployment's own URL, and the push needs the client in `env`, and a Convex.Deployment cannot take
// `env` from its own outputs. So "Deployment" holds the deployment with no source, the client takes
// its name, and "Site" takes the same deployment over with adopt(true), writes the variables, and
// pushes. Without a client, on a laptop or outside Samebase, the variables hold the off values and
// the app has guest sign-in. The first run of a stack that deployed before this split keeps its row
// "Deployment", which stops pushing, and "Site" takes the deployment over, so nothing is recreated.
import { execFileSync } from "node:child_process";
import * as GitHub from "@alchemy.run/github";
import * as Convex from "@samebase/alchemy-convex";
import * as Alchemy from "alchemy";
import { adopt } from "alchemy/AdoptPolicy";
import * as RemovalPolicy from "alchemy/RemovalPolicy";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/** The Convex team that holds the project and the state: the variable CONVEX_TEAM_ID, an id or a slug. */
const team = process.env["CONVEX_TEAM_ID"];
if (team === undefined || team === "") {
  throw new Error(
    "Set the repository variable CONVEX_TEAM_ID to your Convex team (README, Start).",
  );
}

/**
 * The name of this app at the identity hub, set once. The hub derives the ID of each user from it,
 * so it must never change: a new name means new users.
 */
const HUB_APP = "app";

/** The commit of this run, which the hub records on a new client. */
const softwareVersion = process.env["GITHUB_SHA"];

/** The GitHub repository, `owner/name`: GITHUB_REPOSITORY in Actions, else the origin remote. */
const repository =
  process.env["GITHUB_REPOSITORY"] ??
  /[:/]([^/:]+\/[^/]+?)(?:\.git)?$/.exec(
    execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim(),
  )?.[1];
if (repository === undefined) {
  throw new Error("Set GITHUB_REPOSITORY to owner/name: the origin remote names no repository.");
}

export default Alchemy.Stack(
  repository,
  {
    // The GitHub provider has no resource here: it forgets the PreviewComment rows of older previews.
    providers: Layer.mergeAll(GitHub.providers(), Convex.providers()),
    state: Convex.state({ team }),
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
        ? yield* Convex.Project("Project", {
            team,
            name: repository.slice(repository.indexOf("/") + 1),
          }).pipe(RemovalPolicy.destroy())
        : yield* Convex.Project.ref("Project", { stage: "prod" });
    // Production stays with the project, which owns it: both rows keep the default removal policy
    // `retain`, and destroying the stage deletes the project. A deployment with code that is not in
    // state still stops at "Deployment" until --adopt. A preview goes with its stage: both rows
    // delete it on destroy, and the second delete finds it gone. adopt(true) on "Deployment" also
    // takes over a preview with the name of this stage that an interrupted run left behind.
    const deployment =
      stage === "prod"
        ? yield* Convex.Deployment("Deployment", { project, type: "prod" })
        : yield* Convex.Deployment("Deployment", {
            project,
            type: "preview",
            name: stage,
          }).pipe(adopt(true), RemovalPolicy.destroy());
    const client = yield* Convex.SharedHubClient("HubClient", {
      app: HUB_APP,
      deployment: deployment.name,
      deploymentType: stage === "prod" ? "production" : "preview",
      ...(softwareVersion === undefined ? {} : { softwareVersion }),
    });
    const env = {
      HUB_ISSUER: client.issuer,
      HUB_CLIENT_ID: client.clientId,
      HUB_CLIENT_SECRET: client.clientSecret,
    };
    const site =
      stage === "prod"
        ? yield* Convex.Deployment("Site", { project, type: "prod", source, env }).pipe(adopt(true))
        : yield* Convex.Deployment("Site", {
            project,
            type: "preview",
            name: stage,
            source,
            env,
          }).pipe(adopt(true), RemovalPolicy.destroy());

    return { url: site.siteUrl };
  }),
);
