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

## 4. add the @/\* import alias

```sh
vp run build
```

Add the `@/*` TypeScript path alias and the matching Vite alias so generated
shadcn/ui imports use the same shape as the current `notermd/app` template.

## 5. initialize shadcn/ui

```sh
vp add @fontsource-variable/geist class-variance-authority clsx lucide-react radix-ui shadcn tailwind-merge tw-animate-css
pnpm approve-builds msw
vp run build
```

Add the shadcn Nova preset foundation:

- `components.json`
- `src/lib/utils.ts`
- shadcn theme imports and CSS variables in `src/style.css`

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
```

Create user-facing setup docs:

- `README.md` explains how to copy the app, create a Convex project, and deploy
  through Cloudflare Workers
- `docs/local-setup.md` explains local Vite+, Convex, and anonymous-agent setup
- `docs/logos/` stores the service logos used by the README

The README points users at `wrangler.jsonc` as the source of truth for the
Workers build command, asset directory, and SPA fallback.

## 15. align Workers build defaults

```sh
vp run build
vp run deploy:dry-run
```

Update the Cloudflare setup path after walking through the current Workers Git
dashboard:

- `build` now delegates to the Cloudflare-aware build script
- `build:app` keeps the plain TanStack/static build visible
- the README keeps Cloudflare's default `pnpm run build` and
  `npx wrangler deploy` commands
- the README notes that the Cloudflare project name must match
  `wrangler.jsonc` `name`

This keeps the dashboard setup simple for users while preserving an explicit
Cloudflare build script in `package.json`.

## 16. remove the fixed Worker name

```sh
vp run check
CLOUDFLARE_WORKER_NAME=app-start-workers vp run deploy:dry-run
CLOUDFLARE_WORKER_NAME=app-start-workers vp run deploy:preview:dry-run
```

Remove `name` from `wrangler.jsonc` so the template does not force every user
or automated noter.md deployment to rename either Cloudflare or the repository.

Add `scripts/deploy-cloudflare.ts` so Cloudflare Workers Builds can pass the
actual connected Worker name through `WRANGLER_CI_OVERRIDE_NAME`:

- `pnpm run deploy` wraps `wrangler deploy --name <worker>`
- `pnpm run deploy:preview` wraps `wrangler versions upload --name <worker>`
- local dry-runs can set `CLOUDFLARE_WORKER_NAME`

The wrapper runs the Cloudflare build path locally before Wrangler, but skips
that build during Workers Builds because the dashboard already ran
`pnpm run build`. `wrangler.jsonc` stays focused on assets, SPA fallback, and
preview URLs.

## 17. run Cloudflare scripts as plain JavaScript

```sh
vp run check
CONVEX_DEPLOY_KEY=<redacted> vp run build:cloudflare
CLOUDFLARE_WORKER_NAME=app-start-workers vp run deploy:dry-run
WORKERS_CI=1 WRANGLER_CI_OVERRIDE_NAME=app-start-workers vp run deploy:dry-run
CLOUDFLARE_WORKER_NAME=app-start-workers vp run deploy:preview:dry-run
WORKERS_CI=1 WRANGLER_CI_OVERRIDE_NAME=app-start-workers vp run deploy:preview:dry-run
```

Rename the Cloudflare build and deploy helper scripts from `.ts` to `.js`.
Local Node can run TypeScript directly in some environments, but Cloudflare
Workers Builds uses Node 22 and does not execute `.ts` files with plain `node`.

Keeping these scripts as ESM JavaScript lets the dashboard defaults stay simple:

- `pnpm run build`
- `pnpm run deploy`
- `pnpm run deploy:preview`

No extra TypeScript runner is needed in the deployment path.

## 18. pin Node 24 for TypeScript helper scripts

```sh
printf "24\n" > .node-version
vp run check
CLOUDFLARE_WORKER_NAME=app-start-workers vp run deploy:dry-run
CLOUDFLARE_WORKER_NAME=app-start-workers vp run deploy:preview:dry-run
WORKERS_CI=1 WRANGLER_CI_OVERRIDE_NAME=app-start-workers vp run deploy:dry-run
WORKERS_CI=1 WRANGLER_CI_OVERRIDE_NAME=app-start-workers vp run deploy:preview:dry-run
```

Pin Cloudflare Workers Builds to Node 24 with `.node-version` and switch the
Cloudflare helper scripts back to TypeScript.

Node 24 can run TypeScript files that only use erasable TypeScript syntax, so
the build and deploy scripts stay typed without adding a runtime TypeScript
loader to the deploy path.

## 19. explain the Node 24 build pin

```sh
vp run build
```

Document why `.node-version` exists in the README: Cloudflare Workers Builds
uses the file to select Node 24, and Node 24 can execute the small TypeScript
helper scripts directly.

## 20. split Workers Convex deploy keys

```sh
vp run check
WORKERS_CI=1 CONVEX_DEPLOY_KEY=legacy node ./scripts/build-cloudflare.ts
WORKERS_CI=1 WORKERS_CI_BRANCH=feature node ./scripts/build-cloudflare.ts
```

Use the same Convex deploy-key contract as noter.md production and
noter-managed app provisioning:

- `PROD_CONVEX_DEPLOY_KEY` is selected for the `main` branch.
- `PREVIEW_CONVEX_DEPLOY_KEY` is selected for non-production branches.
- `CONVEX_DEPLOY_KEY` is passed only to the Convex child process, because that
  is the name the Convex CLI expects.

The dashboard setup now asks users to create both split build secrets. A local
dry-run with no split keys still builds static assets only, while a local run
with split keys but no branch fails closed instead of guessing which Convex
deployment to touch.

## 21. add guest auth

```sh
vp add @convex-dev/auth @auth/core@0.37.0
CONVEX_AGENT_MODE=anonymous vp exec convex dev --once --typecheck=disable
vp run check
vp run build
```

Add Convex Auth with the anonymous provider so the starter app has a real
authenticated identity without any external auth service.

Todos now keep guest authors while the list stays public:

- `convex/auth.ts`, `convex/auth.config.ts`, and `convex/http.ts` configure
  Convex Auth
- `convex/schema.ts` adds the auth tables and stores `todos.userId` for author
  attribution
- `convex/todos.ts` derives the user from Convex Auth instead of trusting the
  client when creating or toggling todos
- the home route prompts unauthenticated users to continue as a guest and lets
  signed-in users sign out while the todo list remains visible publicly

The dev and Cloudflare build scripts configure Convex Auth JWT keys only when a
deployment does not already have them, so new deployments work without rotating
existing sessions on every build.
