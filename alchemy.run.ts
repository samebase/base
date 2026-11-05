// The stack has three kinds of stage:
//
// - `prod` is the production deployment of the Convex project of this repository. It owns the
//   project, and `alchemy destroy --stage prod` deletes the project with every deployment.
// - `dev-<name>` is a laptop: `pnpm run dev` deploys it before `convex dev`, with the Convex CLI
//   login (scripts/run-primary-dev.ts). It has its own cloud development deployment with the
//   reference `dev-<name>`, found or created in the project of the deployment that the Convex CLI
//   selects (CONVEX_PROJECT_ID). It never creates a project. `alchemy destroy --stage dev-<name>` deletes its hub
//   client and keeps the deployment.
// - Any other stage, such as `pr-42` for a pull request, is a preview deployment named after the
//   stage, which `alchemy destroy` deletes.
//
// The push is the `deploy` script: convex-hosting builds the site, sets the Convex Auth keys,
// uploads the site, and pushes the functions.
//
// The stack is named after the repository, `owner/name`, and its Convex project after `name`. The
// state of every stage is in the `alchemy-state-store` project of the team, which Convex.state()
// creates on the first run. Every run needs the team token CONVEX_ACCESS_TOKEN, or a Convex CLI
// login (`npx convex login`) on a laptop; it mints the deploy keys itself.
//
// Each deployment asks Samebase for a client of the identity hub, for Google sign-in. Production and
// previews prove the repository with the GitHub OIDC token of the run (`id-token: write` in the
// workflows). A `dev-` stage uses the app's initial access token, which the production registration
// saved in the state of `prod`. Samebase reads /samebase-verification.json on the site, which
// convex/http.ts serves from the variable SAMEBASE_REPOSITORY_ID, so the site must be live before
// the client, and the push cannot take the client in `env`. So "Deployment" pushes and sets
// SAMEBASE_REPOSITORY_ID, the client takes the site's URL, and "Site" takes the same deployment over
// with adopt(true) and writes the client's three variables with no push. "Site" removes only the
// names that leave its own `env`, so the repository id stays. Without a client, such as on a laptop
// before the first deploy to main, the variables hold the off values and the app has guest sign-in.
import { execFileSync } from "node:child_process";
import * as GitHub from "@alchemy.run/github";
import * as Convex from "@samebase/alchemy-convex";
import * as Alchemy from "alchemy";
import { adopt } from "alchemy/AdoptPolicy";
import * as Output from "alchemy/Output";
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

/** The Convex project of the repository: its `name`. */
const projectName = repository.slice(repository.indexOf("/") + 1);

/**
 * The numeric id of the repository, which GitHub Actions sets in every run. The site serves it at
 * /samebase-verification.json, so a fork serves its own id with no change to any file. A `dev-`
 * stage reads it from the state of `prod` instead.
 */
const repositoryId = process.env["GITHUB_REPOSITORY_ID"];
const verification = repositoryId ? { env: { SAMEBASE_REPOSITORY_ID: repositoryId } } : {};

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

    if (stage.startsWith("dev-")) {
      // A laptop. The project is the one of the deployment that the Convex CLI selects, which
      // scripts/run-primary-dev.ts passes in CONVEX_PROJECT_ID, so the stage never creates a project
      // and works before the first deploy to main. Both deployment rows keep the default removal
      // policy `retain`: a destroy of the stage deletes only the hub client.
      const projectId = Number(process.env["CONVEX_PROJECT_ID"]);
      if (!Number.isInteger(projectId) || projectId <= 0) {
        throw new Error(
          `Stage ${stage} needs CONVEX_PROJECT_ID, the id of the Convex project of the selected deployment. Run pnpm run dev, which sets it.`,
        );
      }
      const project = { projectId };
      // The initial access token and the repository id from the client of `prod`, or the off
      // values when `prod` has no client yet.
      const production = Convex.SharedHubClient.read("HubClient", { stage: "prod" });
      const deployment = yield* Convex.Deployment("Deployment", {
        project,
        type: "dev",
        name: stage,
        source,
        env: { SAMEBASE_REPOSITORY_ID: production.repository },
      }).pipe(adopt(true));
      const client = yield* Convex.SharedHubClient("HubClient", {
        app: HUB_APP,
        redirectUri: Output.interpolate`${deployment.siteUrl}/auth/hub/callback`,
        deploymentType: "development",
        initialAccessToken: production.initialAccessToken,
        ...(softwareVersion === undefined ? {} : { softwareVersion }),
      });
      const variables = Convex.SharedHubClient.variables(client);
      const site = yield* Convex.Deployment("Site", {
        project,
        type: "dev",
        name: stage,
        env: {
          HUB_ISSUER: variables.issuer,
          HUB_CLIENT_ID: variables.clientId,
          HUB_CLIENT_SECRET: variables.clientSecret,
        },
      }).pipe(adopt(true));

      return { url: site.siteUrl, deployment: site.name };
    }

    // The stage `prod` owns the project, and `alchemy destroy --stage prod` deletes it with
    // every deployment. A preview stage reads the project from the state of `prod`.
    const project =
      stage === "prod"
        ? yield* Convex.Project("Project", { team, name: projectName }).pipe(
            RemovalPolicy.destroy(),
          )
        : yield* Convex.Project.ref("Project", { stage: "prod" });
    // Production stays with the project, which owns it: both rows keep the default removal policy
    // `retain`, and destroying the stage deletes the project. A deployment with code that is not in
    // state still stops at "Deployment" until --adopt. A preview goes with its stage: both rows
    // delete it on destroy, and the second delete finds it gone. adopt(true) on "Deployment" also
    // takes over a preview with the name of this stage that an interrupted run left behind.
    const deployment =
      stage === "prod"
        ? yield* Convex.Deployment("Deployment", {
            project,
            type: "prod",
            source,
            ...verification,
          })
        : yield* Convex.Deployment("Deployment", {
            project,
            type: "preview",
            name: stage,
            source,
            ...verification,
          }).pipe(adopt(true), RemovalPolicy.destroy());
    const client = yield* Convex.SharedHubClient("HubClient", {
      app: HUB_APP,
      redirectUri: Output.interpolate`${deployment.siteUrl}/auth/hub/callback`,
      deploymentType: stage === "prod" ? "production" : "preview",
      ...(softwareVersion === undefined ? {} : { softwareVersion }),
    });
    // The client's values, or the off values while the hub suspends the client.
    const variables = Convex.SharedHubClient.variables(client);
    const env = {
      HUB_ISSUER: variables.issuer,
      HUB_CLIENT_ID: variables.clientId,
      HUB_CLIENT_SECRET: variables.clientSecret,
    };
    // A Convex.Deployment with `env` and no source writes the variables and pushes nothing.
    const site =
      stage === "prod"
        ? yield* Convex.Deployment("Site", { project, type: "prod", env }).pipe(adopt(true))
        : yield* Convex.Deployment("Site", { project, type: "preview", name: stage, env }).pipe(
            adopt(true),
            RemovalPolicy.destroy(),
          );

    return { url: site.siteUrl };
  }),
);
