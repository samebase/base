## 1. initialize vite plus application

```sh
vp create vite:application \
  --directory app-start-workers \
  --agent codex \
  --editor vscode \
  --hooks \
  --no-interactive \
  --verbose
```

## 2. add React and TanStack Start manually

```sh
vp add react react-dom @tanstack/react-router @tanstack/react-start
vp add -D @tanstack/router-plugin @types/node @types/react @types/react-dom @vitejs/plugin-react
vp build
vp run build
```

Replace the generated Vite demo with a small TanStack Start route shell:

- remove `index.html`
- remove the generated Vite demo files under `src/`
- create `src/router.tsx`
- create `src/routes/__root.tsx`
- create `src/routes/index.tsx`
- create `src/routes/about.tsx`

TanStack Start is configured in SPA mode, with `/index.html` as the prerendered
shell for static hosting.

## 3. add Tailwind CSS

```sh
vp add tailwindcss @tailwindcss/vite
vp run build
```

Add the Tailwind Vite plugin and import Tailwind from `src/style.css`. The app
still uses plain CSS classes at this step; Tailwind is present before shadcn/ui
so the styling layers stay easy to inspect.

## 4. add package import aliases

```sh
vp run build
```

Add Node package imports for app-internal aliases instead of a TypeScript
`@/*` path alias. The mapping lives in `package.json` `imports`:

- `#components/*`, `#lib/*`, and `#hooks/*` map into `src/`
- TypeScript, Vite, and shadcn resolve the same specifiers, so there is no
  duplicate `compilerOptions.paths` or Vite `resolve.alias` entry
- named roots are used because Node 22 rejects `#/...` specifiers

`docs/package-imports.md` records the research behind this choice.

## 5. initialize shadcn/ui

```sh
vp add class-variance-authority clsx lucide-react radix-ui shadcn tailwind-merge tw-animate-css
pnpm approve-builds msw
vp run build
```

Add the shadcn Nova preset foundation:

- `components.json`
- `src/lib/utils.ts`
- shadcn theme imports and CSS variables in `src/style.css`
- a system `--font-sans` stack, so the starter has no webfont swap on first load
- a pointer cursor on enabled buttons, which Tailwind v4 no longer applies by
  default

This commit prepares the theme and `cn()` helper, but does not add concrete UI
primitives yet.

## 6. enforce Oxc formatting in VS Code

```sh
vp run build
```

Force common web file types to use the Oxc VS Code formatter. The setting is
tracked even though the generated Vite `.gitignore` ignores most `.vscode`
files, because this template wants format-on-save to match the project.

## 7. add the shadcn primitives we need

```sh
vp exec shadcn add button checkbox input --yes
vp run build
```

Generate the same UI primitives used by the starter todo UI:

- `src/components/ui/button.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/input.tsx`

No product UI changes yet; this keeps generated primitive code separate from
the app example.

## 8. add Convex

```sh
vp add convex
pnpm approve-builds esbuild
CONVEX_AGENT_MODE=anonymous vp exec convex dev --once --typecheck=disable
vp run build
```

Add Convex as the backend layer while keeping the first backend state empty:

- `convex.json` disables Convex AI files for this step
- `convex/schema.ts` starts with an empty schema
- `src/lib/convex.tsx` wires the React provider at the route root
- generated Convex bindings under `convex/_generated/` are committed

The app can run with a real `VITE_CONVEX_URL`, and shows a small setup message
when that environment variable is missing.

## 9. add Convex AI files

```sh
vp exec convex ai-files install
vp run build
```

Enable Convex AI files for Codex and install the generated guidance files. This
adds the agent instructions, Convex AI guidelines, and the generated skills lock
so future agents know how to work inside the Convex backend.

## 10. add the todo example

```sh
vp exec convex codegen --typecheck=disable
vp run build
```

Add the first real app behavior:

- `convex/schema.ts` defines the `todos` table
- `convex/todos.ts` exposes list, create, and toggle functions
- `src/routes/index.tsx` renders the todo UI with Convex hooks
- the root and about routes switch to the shadcn-styled app shell

The Convex bindings are regenerated after the schema and functions are added.

## 11. add the QR share block

```sh
vp add qrcode.react
vp run build
```

Render a QR code for the current browser URL above the todo list. The URL is
read after mount so TanStack Start's prerendered HTML stays stable.

## 12. add the local dev workflow

```sh
vp run build
```

Add `scripts/run-worktree-dev.ts` so anonymous Convex mode works on macOS, Linux,
and Windows without relying on shell-specific environment variable syntax. The
user-facing `dev:worktree` script now delegates to that Node wrapper.

## 13. deploy static assets with Workers

```sh
vp add -D wrangler
vp exec wrangler --version
vp run deploy:dry-run
```

Create `wrangler.jsonc` so the repository owns the Cloudflare Workers deploy
contract:

- the build command runs `pnpm run build:cloudflare`
- static assets are served from `./dist/client`
- missing paths fall back to the SPA shell

`scripts/build-cloudflare.ts` deploys Convex first when `CONVEX_DEPLOY_KEY` is
set, creates Convex preview deployments when `WORKERS_CI_BRANCH` is set, and
falls back to a static-only build for local dry-runs without a deploy key.

## 14. teach Workers self-deployment

```sh
vp run build
vp run deploy:dry-run
```

Create user-facing setup docs:

- `README.md` explains how to copy the app, create a Convex project, and deploy
  through Cloudflare Workers
- `docs/local-setup.md` explains local Vite+, Convex, and worktree setup
- `docs/logos/` stores the service logos used by the README

The dashboard setup keeps Cloudflare's default `pnpm run build`: `build`
delegates to the Cloudflare-aware build script while `build:app` keeps the
plain TanStack/static build visible. The README points users at
`wrangler.jsonc` as the source of truth for the Workers build command, asset
directory, and SPA fallback.

## 15. remove the fixed Worker name

```sh
vp run check
CLOUDFLARE_WORKER_NAME=app-start-workers vp run deploy:dry-run
CLOUDFLARE_WORKER_NAME=app-start-workers vp run deploy:preview:dry-run
```

Remove `name` from `wrangler.jsonc` so the template does not force every user
or automated Samebase app provisioning to rename either Cloudflare or the
repository.

Add `scripts/deploy-cloudflare.ts` so Cloudflare Workers Builds can pass the
actual connected Worker name through `WRANGLER_CI_OVERRIDE_NAME`:

- `pnpm run deploy` wraps `wrangler deploy --name <worker>`
- `pnpm run deploy:preview` wraps `wrangler versions upload --name <worker>`
- local dry-runs can set `CLOUDFLARE_WORKER_NAME`

The wrapper runs the Cloudflare build path locally before Wrangler, but skips
that build during Workers Builds because the dashboard already ran
`pnpm run build`. `wrangler.jsonc` stays focused on assets, SPA fallback, and
preview URLs.

`.node-version` pins Workers Builds to Node 24. Node 24 runs these TypeScript
helper scripts directly because they only use erasable TypeScript syntax, so no
runtime TypeScript loader enters the deploy path.

## 16. split the Convex deploy keys

```sh
vp run check
WORKERS_CI=1 CONVEX_DEPLOY_KEY=legacy node ./scripts/build-cloudflare.ts
WORKERS_CI=1 WORKERS_CI_BRANCH=feature node ./scripts/build-cloudflare.ts
```

Production and preview builds must not share a Convex deployment:

- `CONVEX_DEPLOY_KEY` is selected only when `WORKERS_CI_BRANCH` is `main`. It
  is a Convex production deploy key with exactly `deployment:deploy`,
  `deployment:env:view`, `deployment:env:write`, and `deployment:data:view`.
  Do not grant data write, function-run, logs, backups, or integration
  permissions.
- `PREVIEW_CONVEX_DEPLOY_KEY` is required for every non-production branch and
  is Convex's project-level Preview deploy key.
- a run with either key but no `WORKERS_CI_BRANCH` fails closed instead of
  guessing which Convex deployment to touch.

The Workers dashboard does not expose a Pages-style per-environment selector
for build variables, so `scripts/build-cloudflare.ts` selects the key from
`WORKERS_CI_BRANCH`. `docs/cloudflare-workers-builds.md` records the contract.

## 17. add guest auth

```sh
vp add @convex-dev/auth @auth/core@0.37.0
CONVEX_AGENT_MODE=anonymous vp exec convex dev --once --typecheck=disable
vp run check
vp run build
```

Add Convex Auth with the anonymous provider so the starter app has a real
authenticated identity without any external auth service:

- `convex/auth.ts`, `convex/auth.config.ts`, and `convex/http.ts` configure
  Convex Auth
- `convex/schema.ts` adds the auth tables and stores `todos.userId`
- `convex/todos.ts` derives the user from Convex Auth instead of trusting the
  client when creating or toggling todos
- `convex/guests.ts` assigns each guest a readable display name from a fixed
  pool
- the home route prompts unauthenticated users to continue as a guest and lets
  signed-in users sign out

The dev and Cloudflare build scripts configure Convex Auth JWT keys only when a
deployment does not already have them, so new deployments work without rotating
existing sessions on every build.

## 18. share the todo list publicly

```sh
vp run check
vp run build
```

The todo list becomes public while writes stay authenticated:

- `convex/todos.ts` returns every user's todos with the author's display name,
  and the home route renders the creator under each todo
- todo text is capped at 280 characters and each user keeps at most 50 todos,
  so a public list cannot be flooded
- `convex/guests.ts` falls back to a generated guest name when the fixed pool
  runs out

## 19. prerender the home and about routes

```sh
vp run check
vp run build
vp run deploy:dry-run
```

Prerender the public routes during the static build:

- `scripts/cloudflare-prerender-pages.ts` is the source of truth for the
  prerendered pages
- `vite.config.ts` prerenders them through TanStack Start and keeps the SPA
  shell on `/index.html` for Cloudflare's SPA fallback
- `scripts/generate-cloudflare-redirects.ts` rewrites only the tagged generated
  block in `public/_redirects`, and `verify:cloudflare-redirects` fails
  `vp run check` when the committed file drifts
- vitest covers the redirects generator and the Convex deploy key selection
