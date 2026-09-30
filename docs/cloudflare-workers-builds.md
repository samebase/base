# Cloudflare Workers Builds

This app deploys through Cloudflare Workers Builds. The Cloudflare dashboard runs
`pnpm run build`, then runs `pnpm run deploy` for the production branch or
`pnpm run deploy:preview` for other branches.

## Build Variables

Set `CONVEX_DEPLOY_KEY` separately in **Settings > Builds > Variables and secrets**:

- Production: a Convex production deploy key.
- Previews Base: the Convex project's Preview deploy key.

These are build secrets. Previews Base runtime variables and secrets are Worker bindings, so they
are not the place for a Convex deploy key. Samebase puts `SAMEBASE_CONVEX_PROJECT`, its project
identity marker, in production build variables only.

Do not add `VITE_CONVEX_URL`. Convex supplies the selected deployment URL to the frontend command
that runs through `convex deploy --cmd`.

Cloudflare supplies each environment's `CONVEX_DEPLOY_KEY` to the build. The build script does not
select between two key names. Convex checks the key's deployment type before deploying.

Keep `pnpm run build`, `pnpm run deploy`, and `pnpm run deploy:preview` as the Builds commands.
The deploy scripts run `wrangler deploy` and `wrangler preview`. Wrangler gets the Worker name from
Workers Builds, so the template does not need a fixed name. `previews: {}` in `wrangler.jsonc`
permits native preview deployment; it does not enable preview builds in the dashboard.

When migrating an existing app, open **Settings > Builds > Set up Worker Previews > Set up**,
then select **Switch to Worker Previews**. Enable preview builds and replace the copied production
key in Previews Base with the project's Preview key. Remove `PREVIEW_CONVEX_DEPLOY_KEY` from build settings.
Existing branch previews keep their saved build variables. Use a new branch name after correcting
Previews Base. Retrying or deleting the Worker preview does not reset those variables. Check both
production and a new branch preview before finishing.

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

Local builds do not deploy Convex, even when a deploy key exists in the shell. A local dry run
builds and validates the Worker package without publishing it:

```sh
pnpm run deploy:dry-run --name my-worker
```

Wrangler does not support a native preview dry run. Use a real test branch to verify a preview.

## References

- [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Cloudflare Workers Builds API reference](https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/)
