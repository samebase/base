# Local setup

Use this when you want to run the app from your own computer instead of only
through the GitHub deploy workflow.

## Install Vite+

On macOS or Linux:

```sh
curl -fsSL https://vite.plus | bash
```

On Windows PowerShell:

```powershell
irm https://vite.plus/ps1 | iex
```

Open a new terminal after installing Vite+. Enable the package-manager shims, then install
dependencies:

```sh
corepack enable
pnpm install
```

## Run the app

From the repository root:

```sh
pnpm run dev
```

`pnpm run dev` starts Convex and TanStack Start together. On the first run,
Convex may ask you to sign in and choose or create a development deployment.
In a linked Git worktree, it automatically uses an isolated local backend.

Open the local URL printed by Vite.

## First run

On a fresh clone, the first push of `pnpm run dev` fails: `convex/convex.config.ts` requires the
Convex Auth keys `AUTH_PRIVATE_KEY` and `AUTH_JWKS` and the three `HUB_` variables, and
`convex/http.ts` imports `.convex-hosting/version.js` and the server build `dist/server/server.js`.
Only a deploy creates them. Keep `pnpm run dev` running, because a local backend runs inside it, and run this in a
second terminal:

```sh
pnpm run deploy:dev
```

It builds the app, creates the Convex Auth keys, sets the `HUB_` variables to their off values,
uploads the files to the development deployment, writes the version file, and pushes. Then stop `pnpm run dev` and start it again; it works as usual
from then on. Run `pnpm run deploy:dev` again whenever you want the development deployment's
`.convex.site` URL to serve the current build.

## Force worktree mode

Use the normal `pnpm run dev` command in a linked Git worktree. Use the explicit
worktree command to force an isolated local backend in another checkout.

```sh
pnpm run dev:worktree
```

The context launcher selects `run-primary-dev.ts` or `run-worktree-dev.ts`.
Both modes use the same Windows-safe service launcher.
