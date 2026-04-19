# Research: v1 onboarding without local Convex CLI

Date: April 20, 2026

## Goal

Reduce initial onboarding friction for this template.

The desired v1 experience is:

- no local Convex CLI login required
- no Codex requirement for initial setup
- one production deployment path only
- Cloudflare Pages performs the real deploys by default

## Short answer

This is viable.

The simplest v1 path is:

1. Create a Convex project in the Convex dashboard.
2. Pick the Europe region if desired.
3. Create a production deploy key.
4. Create a Cloudflare Pages project from the repo.
5. Set `CONVEX_DEPLOY_KEY` and `NODE_VERSION=24` in Cloudflare Pages.
6. Set the Pages build command to:

```sh
pnpm run build:cloudflare
```

7. Set output directory to `dist`.

That gives a production-first setup with no local Convex login step. The repo
owns the Cloudflare entrypoint, so the Pages dashboard can keep one stable
build command even after preview deploys are added later.

## What is true today

### 1. The repo is not currently covered by this onboarding story

The current README still assumes:

- starting in Codex
- cloning locally
- running `vp install`
- running `vp run dev`
- following interactive Convex prompts locally

So the current docs do not yet match the lower-friction dashboard-plus-Pages setup.

### 2. Vite+ should be the visible setup tool when local development is needed

If we later introduce local development, Vite+ should be the first-class setup story, especially on Windows.

Reasons:

- Vite+ handles Node.js runtime management
- Vite+ wraps the underlying package manager
- the user-facing instruction can stay focused on `vp` instead of asking beginners to reason about Node and `pnpm` separately

In other words, `pnpm` is mostly an implementation detail for this template in
local development. It does not need to be the headline onboarding concept there.

The Cloudflare Pages build command is a separate concern. Using
`pnpm run build:cloudflare` there is fine because it is the most interoperable
way to invoke a repo-owned script in hosted CI, and it keeps the dashboard
instruction short.

That is one of the strongest reasons to keep Vite+ in this stack: it is the fastest path to a working local setup on Windows.

### 3. Convex supports non-interactive deploys with `CONVEX_DEPLOY_KEY`

Convex documents `CONVEX_DEPLOY_KEY` for non-interactive environments such as production build systems.

That means Cloudflare Pages can run `convex deploy` without a local login flow.

Relevant docs:

- [Convex deploy keys](https://docs.convex.dev/cli/deploy-key-types)
- [Convex custom hosting](https://docs.convex.dev/production/hosting/custom)

### 4. Cloudflare Pages supports the needed build command and env vars

Cloudflare Pages supports:

- custom build commands
- build-time environment variables
- `dist` as a normal build output directory for Vite apps
- branch-aware build behavior through `CF_PAGES_BRANCH`

Relevant docs:

- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages build image](https://developers.cloudflare.com/pages/configuration/build-image/)

### 5. Convex region selection can happen in the dashboard

Convex documents region selection in the dashboard. As of this research date, Europe is covered by `EU West (Ireland)`.

Relevant docs:

- [Convex regions](https://docs.convex.dev/production/regions)

## Recommended v1 onboarding

### Recommended user flow

1. Create a repo from the template.
2. In the Convex dashboard, create a project.
3. Select `EU West (Ireland)` if the user wants Europe.
4. Generate a production deploy key.
5. In Cloudflare Pages, create a project connected to the GitHub repo.
6. Set:

```text
CONVEX_DEPLOY_KEY=<production deploy key>
NODE_VERSION=24
```

7. Set build command to:

```sh
pnpm run build:cloudflare
```

8. Set output directory to:

```text
dist
```

If local development is introduced later, the beginner-facing instruction should be:

- install Vite+
- use `vp`

not:

- install `pnpm`
- manually manage Node first

The `build:cloudflare` script can stay the same later when preview deploys are
introduced. The repo can branch internally on `CF_PAGES_BRANCH` without asking
the user to revisit the Pages dashboard command.

### Why this is the right v1 tradeoff

- It removes the most confusing first-run step: local Convex login/bootstrap.
- It avoids asking new users to understand dev vs prod on day one.
- It keeps deployment authority in one place: Cloudflare Pages.
- It keeps the markdown onboarding short and operational.

## Important caveat: production-first docs still need clear preview behavior

If we use a production deploy key in Pages, then builds that run with that key
deploy to Convex production.

For v1, this is acceptable if we intentionally frame the public onboarding as a
production-first story. But the docs should say that clearly.

Good guardrails for v1:

- do not explain preview branches yet
- do not tell users to configure the same key twice
- do not assume preview branches should point at production forever
- when preview deploys are documented, explain the deploy-key strategy

The clean follow-up story is:

- v1: production only
- v2: introduce preview branches and preview deploy keys when the user is ready to iterate

## Codex web note

Codex web can help with editing, but it should not be part of the initial deployment story.

OpenAI documents that:

- setup scripts can access secrets
- secrets are removed before the agent phase
- setup scripts can persist data into the container by writing files or shell init state

So it is technically possible to pass a Convex deploy key into a Codex cloud environment during setup and make it available later to the agent. But doing that is effectively giving the Codex agent access to the production deploy key.

That is a separate product decision, not a requirement for v1 onboarding.

For v1, the safer recommendation is:

- Codex web can edit code
- Cloudflare Pages remains the only deployment actor

Relevant docs:

- [Codex cloud environments](https://developers.openai.com/codex/cloud/environments)
- [Codex internet access](https://developers.openai.com/codex/cloud/internet-access)

## Recommendation

Change the public onboarding copy to center this story:

1. create Convex project in dashboard
2. create production deploy key
3. put deploy key into Cloudflare Pages
4. let Pages deploy the app

Then introduce local development, Codex web, and preview environments only after the user actually wants to modify the app.

When that later local-development section exists, it should position Vite+ as the easiest Windows setup path and treat `pnpm` as a lower-level implementation detail rather than the main concept.
