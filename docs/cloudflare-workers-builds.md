# Cloudflare Workers Builds

This app deploys through Cloudflare Workers Builds. The Cloudflare dashboard runs
`pnpm run build`, then runs `pnpm run deploy` for the production branch or
`pnpm run deploy:preview` for other branches.

## Build Variables

Set these build secrets in the Cloudflare Workers Builds settings:

- `CONVEX_DEPLOY_KEY`
- `PREVIEW_CONVEX_DEPLOY_KEY`

Do not add `VITE_CONVEX_URL`. Convex supplies the selected deployment URL to the frontend command
that runs through `convex deploy --cmd`.

Cloudflare Workers Builds has separate production and preview build triggers
under the hood, but the dashboard currently shows one build-variable table. To
keep dashboard and API-created configurations equivalent, store both secrets on
both triggers. This also keeps the production and preview keys visible in the
dashboard. Keep this shared layout until Cloudflare exposes separate production
and preview build-variable views.

This template handles that dashboard limitation in `scripts/build-cloudflare.ts`:

1. It reads `WORKERS_CI_BRANCH`.
2. It selects `CONVEX_DEPLOY_KEY` when the branch is `main`.
3. It selects `PREVIEW_CONVEX_DEPLOY_KEY` for every other branch.
4. It passes only the selected value to the Convex deploy subprocess as
   `CONVEX_DEPLOY_KEY`.

That keeps the production key compatible with projects that do not use the
preview-aware wrapper, while still requiring a separate preview key for
non-production branches.

When configuring through the Builds API, write the same two secrets to both
triggers. When configuring through the dashboard, enter both secrets in its
build-variable table. The script selects the correct key for each branch and
keeps preview builds from falling back to the production key.

## Build Ordering

Non-production builds pass `WORKERS_CI_BRANCH` to Convex as the stable preview
name, so repeated commits reuse one preview deployment, URL, and data.

Cloudflare may build more than one commit from the same branch concurrently.
Stable naming does not order those builds: without another check, an older build
that finishes last can replace newer Convex functions. After building the app
and immediately before Convex pushes functions, this template compares the
checked-out Git commit with the remote head of `WORKERS_CI_BRANCH`. A stale
build fails without deploying Convex. The checkout is authoritative because a
manual Workers Build can report the branch name in `WORKERS_CI_COMMIT_SHA`. The
check applies to `main` too, where the same overlap could otherwise roll
production back.

The check adds one authenticated `git ls-remote` request to each provider build.
It is not an atomic compare-and-swap. A branch can still advance in the short
interval between the Git check and Convex's internal push. Eliminating that
residual race requires provider-side serialization or a Convex source-commit
concurrency primitive.

## Local Checks

Local dry-runs can validate the Worker package without build secrets:

```sh
CLOUDFLARE_WORKER_NAME=my-worker vp run deploy:dry-run
CLOUDFLARE_WORKER_NAME=my-worker vp run deploy:preview:dry-run
```

If you set either deploy key locally, also set `WORKERS_CI_BRANCH` so the
script can choose the intended deployment target.

## References

- [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Cloudflare Workers Builds API reference](https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/)
