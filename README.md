# Deploy a production-ready, real-time web app with Cloudflare Workers

<details>
<summary>Technical Summary</summary>

This template is a client-first TanStack Start app. TanStack Start is used in
SPA mode, so the build creates a static `dist/client/index.html` shell and
client assets. The browser talks to Convex for real-time data.

Cloudflare Workers Static Assets serves the static files. The Cloudflare
dashboard runs `pnpm run build`, which delegates to the Cloudflare-aware build
script. `wrangler.jsonc` owns the Worker name, asset directory, SPA fallback,
and local Wrangler deploy behavior.

Local development runs Convex and the frontend together through `vp run dev`.
Cloudflare builds run Convex deploy first when `CONVEX_DEPLOY_KEY` is present,
then build the static frontend. Local dry-runs can still build static assets
without a Convex deploy key.

</details>

## 1. Create accounts

You need:

- [GitHub](https://github.com/)  
  <img src="./docs/logos/github.svg" alt="GitHub" height="32">
- [Convex](https://www.convex.dev/)  
  <img src="./docs/logos/convex.svg" alt="Convex" height="32">
- [Cloudflare](https://www.cloudflare.com/)  
  <img src="./docs/logos/cloudflare.jpg" alt="Cloudflare" height="32">

## 2. Copy the app

Create your own GitHub repository from this template.

If you want the clean teaching history, fork the repository instead of using
GitHub's template button. The template button is simpler, but it squashes the
history into one commit.

## 3. Create a Convex project

Open [dashboard.convex.dev](https://dashboard.convex.dev/), create a project,
and create a Production deploy key.

Keep the key ready. Cloudflare will use it as `CONVEX_DEPLOY_KEY` during builds.

## 4. Create a Cloudflare Worker from GitHub

In Cloudflare, open Workers & Pages and create a Worker connected to your
GitHub repository.

Use these settings:

- Project name: `notermd-app`, matching `wrangler.jsonc`
- Production branch: `main`
- Build command: keep `pnpm run build`
- Deploy command: keep `npx wrangler deploy`
- Non-production branch deploy command: keep `npx wrangler versions upload`
- Path: keep `/`
- Build secret: `CONVEX_DEPLOY_KEY`

The repository's scripts and `wrangler.jsonc` provide the deployment contract:

```jsonc
// package.json
{
  "scripts": {
    "build": "vp run build:cloudflare",
    "build:app": "tsc && vp build",
    "build:cloudflare": "node ./scripts/build-cloudflare.ts",
  },
}

// wrangler.jsonc
{
  "assets": {
    "directory": "./dist/client",
    "not_found_handling": "single-page-application",
  },
  "build": {
    "command": "pnpm run build:cloudflare",
  },
}
```

## 5. Run locally

Install dependencies:

```sh
pnpm install
```

Start Convex and TanStack Start together:

```sh
pnpm run dev
```

For an isolated local agent or worktree backend:

```sh
pnpm run anon
```

## 6. Validate deploy config locally

```sh
pnpm run deploy:dry-run
```

This runs the same Wrangler build path without uploading anything. If
`CONVEX_DEPLOY_KEY` is not set locally, the Cloudflare build script skips Convex
deploy and only builds the static app.

## Why Workers

Cloudflare Pages works well for static apps, but several important settings live
in the dashboard: build command, output directory, and Pages-specific deploy
behavior.

With Workers Static Assets, the deploy shape is split cleanly: Cloudflare's Git
build step runs `pnpm run build`, and `wrangler.jsonc` describes what Wrangler
deploys. That makes the deployment easier to audit, easier for agents to
modify, and easier for users to reproduce.

## Read the history

```sh
git log --oneline --reverse
```

The history is intentionally written as a tutorial. `REPO_HISTORY.md` explains
what each numbered commit added and why.
