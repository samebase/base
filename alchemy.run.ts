// The stack has three kinds of stage:
//
// - `prod` is the production deployment of the Convex project of this repository. It owns the
//   project, and `alchemy destroy --stage prod` deletes the project with every deployment.
// - `dev-<name>` is a development checkout: `pnpm run identity-hub:dev-client --stage dev-<name>`
//   runs it on purpose,
//   with the Convex CLI login, on the development deployment that `.env.local` selects
//   (CONVEX_DEPLOYMENT, written by `convex dev`). It takes that deployment over, never creates a
//   project, and `alchemy destroy --stage dev-<name>` deletes its hub client and keeps the
//   deployment.
// - Any other stage, such as `pr-42` for a pull request, is a preview deployment named after the
//   stage, which `alchemy destroy` deletes.
//
// The push is the `deploy` script: convex-hosting builds the site, sets the Convex Auth keys,
// uploads the site, and pushes the functions.
//
// The stack is named after the repository, `owner/name`, and its Convex project after `name`. The
// state of every stage is in the `alchemy-state-store` project of the team, which Convex.state()
// creates on the first run. Every run needs the team token CONVEX_ACCESS_TOKEN, or a Convex CLI
// login (`npx convex login`) on a development machine; it mints the deploy keys itself. The token
// names its team; with the Convex CLI login, the team is the team of the deployment that .env.local
// selects.
//
// Each deployment asks Samebase's public identity hub for a client, for Google and GitHub sign-in
// through its connectors `google` and `github`, which name the app "Samebase" at Google and
// GitHub. Production and
// previews prove the repository with the GitHub OIDC token of the run (`id-token: write` in the
// workflows). A `dev-` stage uses the app's initial access token, which the production registration
// saved in the state of `prod`. Samebase reads /samebase-verification.json on the site, which
// convex/http.ts serves from the variable SAMEBASE_REPOSITORY_ID, so the site must be live before
// the client, and the push cannot take the client in `env`. So "Deployment" pushes and sets
// SAMEBASE_REPOSITORY_ID, the client takes the site's URL, and "Site" takes the same deployment over
// with adopt(true) and writes the client's three variables with no push. "Site" removes only the
// names that leave its own `env`, so the repository id stays. The push of "Deployment" sets the off
// values of the client's variables when they are missing (scripts/ensure-convex-auth.ts), so a
// deployment of an earlier version with the HUB_ names takes the IDENTITY_HUB_ names in one deploy:
// the new code loads with the off values, and "Site" then writes the client and removes the HUB_
// names. Without a client, such as in
// development before the first deploy to main, the variables hold the off values and the app has
// guest sign-in.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import * as Convex from "@samebase/alchemy-convex";
import * as IdentityHub from "@samebase/alchemy-convex/identity-hub";
import * as Alchemy from "alchemy";
import { adopt } from "alchemy/AdoptPolicy";
import * as Output from "alchemy/Output";
import * as RemovalPolicy from "alchemy/RemovalPolicy";
import * as Effect from "effect/Effect";

/** The file of `npx convex dev`: the deployment it selects. */
const envLocal = (() => {
  try {
    return parseEnv(readFileSync(".env.local", "utf8"));
  } catch {
    return {};
  }
})();

/**
 * The name of this app at the identity hub. The hub keeps the clients of each repository and name
 * together. A user's ID is the provider's own, such as `google:<id>`, so a new name keeps the users.
 */
const IDENTITY_HUB_APP = "app";

/**
 * The identity hub that gives this app its clients: Samebase's public hub, deployed from
 * samebase/identity-hub. A hub of your own made from that template goes here, by its issuer.
 */
const HUB = { issuer: "https://id.samebase.com" };

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
    providers: Convex.providers(),
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

    if (stage.startsWith("dev-")) {
      // A development checkout, after one deploy to main and after `npx convex dev` made and
      // selected a dev deployment and pushed the code. This stage gives that deployment its hub
      // client and nothing else: no new deployment, no push. It is run on purpose,
      // `pnpm run identity-hub:dev-client --stage dev-<name>`, and a Google sign-in keeps the client alive, so a
      // checkout in use never needs it again.
      const selected = envLocal["CONVEX_DEPLOYMENT"]?.replace(/^(dev|prod):/, "");
      if (!selected) {
        throw new Error("Run `pnpm run dev` once first: .env.local selects no deployment.");
      }
      const project = yield* Convex.Project.ref("Project", { stage: "prod" });
      // The initial access token and the repository id, which the production deploy saved.
      const production = IdentityHub.Client.read("HubClient", { stage: "prod" });
      // The site must serve /samebase-verification.json before the hub registers the client.
      const site = yield* Convex.Deployment("Verification", {
        project,
        type: "dev",
        name: selected,
        env: { SAMEBASE_REPOSITORY_ID: production.repository },
      }).pipe(adopt(true));
      const client = yield* IdentityHub.Client("HubClient", {
        app: IDENTITY_HUB_APP,
        hub: HUB,
        connectors: ["google", "github"],
        redirectUri: Output.interpolate`${site.siteUrl}/auth/hub/callback`,
        deploymentType: "development",
        initialAccessToken: production.initialAccessToken,
      });
      const variables = IdentityHub.Client.variables(client);
      // Both rows keep the default removal policy `retain`: a destroy deletes only the hub client.
      yield* Convex.Deployment("Site", {
        project,
        type: "dev",
        name: selected,
        env: {
          IDENTITY_HUB_ISSUER: variables.issuer,
          IDENTITY_HUB_CLIENT_ID: variables.clientId,
          IDENTITY_HUB_CLIENT_SECRET: variables.clientSecret,
        },
      }).pipe(adopt(true));

      return { url: site.siteUrl };
    }

    // The stage `prod` owns the project, and `alchemy destroy --stage prod` deletes it with
    // every deployment. A preview stage reads the project from the state of `prod`.
    const project =
      stage === "prod"
        ? yield* Convex.Project("Project", { name: projectName }).pipe(RemovalPolicy.destroy())
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
    const client = yield* IdentityHub.Client("HubClient", {
      app: IDENTITY_HUB_APP,
      hub: HUB,
      connectors: ["google", "github"],
      redirectUri: Output.interpolate`${deployment.siteUrl}/auth/hub/callback`,
      deploymentType: stage === "prod" ? "production" : "preview",
      ...(softwareVersion === undefined ? {} : { softwareVersion }),
    });
    // The client's values, or the off values while the hub suspends the client.
    const variables = IdentityHub.Client.variables(client);
    const env = {
      IDENTITY_HUB_ISSUER: variables.issuer,
      IDENTITY_HUB_CLIENT_ID: variables.clientId,
      IDENTITY_HUB_CLIENT_SECRET: variables.clientSecret,
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
