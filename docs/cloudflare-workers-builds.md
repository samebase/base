# Cloudflare Workers Builds

This app deploys through Cloudflare Workers Builds. The Cloudflare dashboard runs
`pnpm run build`, then runs `pnpm run deploy` for the production branch or
`pnpm run deploy:preview` for other branches.

## Build Variables

Set these build secrets in the Cloudflare Workers Builds settings:

- `CONVEX_DEPLOY_KEY`
- `PREVIEW_CONVEX_DEPLOY_KEY`

Cloudflare Workers Builds has separate production and preview build triggers
under the hood. The Builds API can set build variables per trigger, so an API
setup can store different values for production and preview. The dashboard setup
path does not expose the same Pages-style production/preview environment
selector in the build variables UI.

This template handles that dashboard limitation in `scripts/build-cloudflare.ts`:

1. It reads `WORKERS_CI_BRANCH`.
2. It selects `CONVEX_DEPLOY_KEY` when the branch is `main`.
3. It selects `PREVIEW_CONVEX_DEPLOY_KEY` for every other branch.
4. It passes only the selected value to the Convex deploy subprocess as
   `CONVEX_DEPLOY_KEY`.

That keeps the production key compatible with projects that do not use the
preview-aware wrapper, while still requiring a separate preview key for
non-production branches.

When configuring triggers through the Builds API, store `CONVEX_DEPLOY_KEY` on
the production trigger and `PREVIEW_CONVEX_DEPLOY_KEY` on the preview trigger.
When using the dashboard's generic build variables table, store both secrets;
the script keeps preview builds from falling back to the production key.

## Local Checks

Local dry-runs can validate the Worker package without build secrets:

```sh
CLOUDFLARE_WORKER_NAME=my-worker pnpm run deploy:dry-run
CLOUDFLARE_WORKER_NAME=my-worker pnpm run deploy:preview:dry-run
```

If you set either deploy key locally, also set `WORKERS_CI_BRANCH` so the
script can choose the intended deployment target.

## References

- [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Cloudflare Workers Builds API reference](https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/)
