# base

**Google sign-in that works on every pull request preview.** A starter for apps on
[Convex](https://convex.dev), deployed by [Alchemy](https://alchemy.run) with one secret. No Google
Cloud project, no OAuth client, no Samebase account.

![The comment that a deploy leaves on a pull request, with the preview's URL and "Sign-in with github, google: on", beside the sign-in page of that preview, which names the repository.](./docs/readme/preview-sign-in.png)

[**Use this template**](https://github.com/samebase/base/generate) ·
[Live demo](https://ideal-bandicoot-981.convex.site) ·
[The other parts](https://github.com/samebase)

## Start

1. **Use this template** and create your repository.
2. **Add one secret**, `CONVEX_ACCESS_TOKEN`: a team access token from the Convex dashboard (the
   team, **Settings**, **Access Tokens**). `gh secret set CONVEX_ACCESS_TOKEN` asks for the value
   without showing it.
3. **Push to `main`**, or run `alchemy` from the **Actions** tab. About a minute later the log ends
   with your URL, `https://<deployment>.convex.site`.

That is the whole setup. The first run creates the Convex project, named after the repository, and
its production deployment. From then on every push to `main` deploys, and every pull request gets a
preview deployment with its URL in a comment, deleted when the pull request closes.

![Use the template, add the secret CONVEX_ACCESS_TOKEN, run the deploy workflow, sign in with Google at the hub's page, which names the repository.](./docs/readme/deploy.gif)

If the team already has a project with the repository's name, such as one that `pnpm run dev`
created, the first run stops. Run it once with **adopt**: `gh workflow run alchemy.yml -f adopt=true`.

## The whole sign-in setup

Google and GitHub want each callback URL registered by hand, so a preview with a new URL cannot sign
in. Here each deploy registers its own URL at
[Samebase's identity hub](https://github.com/samebase/identity-hub), with GitHub's token of the run
as proof of the repository. One resource in `alchemy.run.ts` does it:

```ts
const client =
  yield *
  IdentityHub.Client("IdentityHubClient", {
    hub: { issuer: "https://id.samebase.com" },
    connectors: ["google", "github"],
    redirectUris: [Output.interpolate`${deployment.siteUrl}/auth/hub/callback`],
    deploymentType: stage === "prod" ? "production" : "preview",
  });
```

Accounts live in your app: a user is `google:<id>`, and **Delete account** removes them. Guest
sign-in works without the hub.

## What is fixed, and what is yours

Two things are fixed:

- **Convex** runs the real-time backend and the database, and serves the app's files and its
  server-rendered pages through [convex-hosting](https://github.com/samebase/convex-hosting). There
  is no second host to set up or pay for.
- **[Alchemy](https://alchemy.run)** deploys it from one file, `alchemy.run.ts`, with
  [@samebase/alchemy-convex](https://github.com/samebase/samebase/tree/main/packages/alchemy-convex):
  `main` to the stage `prod`, each pull request to `pr-<number>`. No deploy key is stored anywhere;
  each run mints a short-lived one from the team token.

The rest is a starting point:

- **The interface** is React 19 with TanStack Start and shadcn/ui, with pages rendered on the
  server. It is the replaceable part: an agent can rewrite it for another framework.
- **Sign-in** is Convex Auth, with the session in an httpOnly cookie, so signed-in pages render on
  the server.
- **The example app** is a public todo list. Guests sign in with one click, see updates in real
  time, and scan a QR code to open the list on another device.
- **The tools** are Vite+ for dev, format, lint, test, and build, Node.js 24, and Renovate for the
  versions.

## Local development

Install the [Vite+](https://viteplus.dev/guide/) CLI, which installs the Node.js version from
`.node-version` with `vp env install`. Then:

```sh
corepack enable
pnpm install
pnpm run dev
```

`pnpm run dev` starts Convex and TanStack Start together on a cloud development deployment of this
checkout. A linked Git worktree gets its own.

**The first run on a fresh clone stops with an error.** That is expected: the deployment has no
Convex Auth keys and no server build yet. Once Convex has signed you in and written `.env.local`,
stop it and run `pnpm run deploy:dev` once. It creates the keys, uploads the build, and pushes. From
then on `pnpm run dev` works as usual.

For the **Sign in** button in development, after the first deploy to `main`, run
`pnpm run identity-hub:dev-client --stage dev-<your name>` once. It gives the development deployment
its own hub client. See [`docs/local-setup.md`](./docs/local-setup.md) for the details and
troubleshooting on macOS, Linux, and Windows.

| Command                            | Purpose                                               |
| ---------------------------------- | ----------------------------------------------------- |
| `pnpm run check`                   | Format, lint, type-check, and test                    |
| `pnpm run build`                   | Run the checks and build the app into `dist/client`   |
| `pnpm run deploy:dev`              | Build, upload, and push to the development deployment |
| `pnpm run identity-hub:dev-client` | Give the development deployment a hub client (Google) |
| `pnpm run deploy`                  | Build, upload, and push to production                 |

## Learn more

- [How deploys work](./docs/deploys.md): the stages, the state store, local `alchemy deploy`, and
  renaming an old `main` stage to `prod`.
- [Google sign-in](./docs/google-sign-in.md): the hub, `/samebase-verification.json`, apps on other
  hosts, the hub's terms, and how to run your own hub.
- [Files](./docs/files.md): where things are, and which files are generated.

## License

[MIT](./LICENSE). Copy it, change it, ship it; keep the copyright line. See
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for
included third-party material.
