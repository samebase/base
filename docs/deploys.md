# How deploys work

`alchemy.run.ts` is the stack. The stage `prod` is the production deployment. A stage `dev-<name>`
is the deployment of a development checkout, which `alchemy destroy` keeps (see
[Local development](../README.md#local-development)). Any other stage is a preview deployment named
after the stage, which `alchemy destroy` deletes. The push is the `deploy` package script, run by the
Convex deployment resource when the functions, the build inputs, `package.json`, or the lockfile
change; an unchanged checkout deploys nothing.

`.github/workflows/alchemy.yml` names the stages as
[Alchemy's CI guide](https://alchemy.run/environments/ci) does: it deploys each push to `main` to
the stage `prod`, deploys each pull request from this repository to the stage `pr-<number>`, a
preview deployment with that name whose URL, `https://<deployment>.convex.site`, the run comments on
the pull request, and destroys that stage when the pull request closes, all with the team token
`CONVEX_ACCESS_TOKEN`. The token names its team, and creates the Convex project of the repository,
the state project `alchemy-state-store` of the team, and the short-lived deploy keys of each run.
No deploy key is stored anywhere.

The stack is named after the repository, `owner/name` (`GITHUB_REPOSITORY`, or the origin remote in
development), and so is its Convex project. Every run, in CI or local, keeps the state of its stage
in the `alchemy-state-store` project of the team, which the first run creates, under the stack name;
the stage `prod` owns the project, and `alchemy destroy --stage prod` deletes it. The state has no
lock, so the workflow runs one deploy of a stage at a time. A local run uses `npx convex login` when
`CONVEX_ACCESS_TOKEN` is not set:

```sh
pnpm exec alchemy deploy --stage my-preview
pnpm exec alchemy destroy --stage my-preview
```

`pnpm run deploy` runs `npx convex deploy` with the checks, the build, and the upload as its
`--cmd`, so a failed check stops the release before the push switches the site. Inside that build,
`scripts/ensure-convex-auth.ts` creates the Convex Auth keys on a new deployment or preview, sets
each missing `IDENTITY_HUB_` variable to its off value, and keeps every value that exists; it stops
the deploy when the deployment it selects is not the one that the deploy targets. Deploy with
`pnpm run deploy`, never with a plain `npx convex deploy`: a plain push serves the files of the last
deploy from this checkout, often another deployment's.

The build prerenders `/about` with the Convex client, so it needs `VITE_CONVEX_URL` in `.env.local`,
which the first `pnpm run dev` writes; CI passes a placeholder.

## Serving the files

`convex/http.ts` answers each path as a Cloudflare Worker with static assets does: a file of the
build, else the page that the server build of `src/server.ts` renders, including the 404 page. The
build prerenders `/about` into a file, served at `/about` (`--html-handling drop-trailing-slash`).
The files follow Cloudflare's static asset rules. See the
[convex-hosting documentation](https://github.com/samebase/convex-hosting#documentation) for custom
domains, headers, and the deploy options.

## Renaming the production stage

A repository that deployed production as the stage `main`, before this template named it `prod`,
moves it once:

1. Run `alchemy.yml` on `main` with **adopt** (`gh workflow run alchemy.yml -f adopt=true`). The
   stage `prod` takes over the existing project and production deployment and pushes to it; nothing
   is created or deleted.
2. Delete the state of the stage `main`, and only its state. Never run
   `alchemy destroy --stage main`: it deletes the project, which is also the project of `prod`.
   `alchemy state delete <stack>/main --recursive` cannot do it either, because it splits its path
   at each `/` and the stack name `owner/name` has one. Run the state store's `removeStack`
   mutation, signed in with `npx convex login`:

   ```sh
   npx convex run --deployment <team>:alchemy-state-store:prod state:removeStack "{stack: 'owner/name', stage: 'main'}"
   ```

3. Check the stages that are left; the list has `prod` and the `pr-<number>` stages of open pull
   requests:

   ```sh
   npx convex run --deployment <team>:alchemy-state-store:prod state:stages "{stack: 'owner/name'}"
   ```
