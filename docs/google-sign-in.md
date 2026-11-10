# Google sign-in

Guest sign-in always works. The home page also shows **Sign in** when the deployment has a client
of Samebase's identity hub, and it needs no Google project or key of yours. The button goes to the
hub's page, which names the app and offers Google and GitHub.

Each deploy from GitHub Actions gets its client, with no Samebase account: `alchemy.run.ts` asks
Samebase's identity hub with GitHub's token of the run (`id-token: write`) and writes it to the
variables `IDENTITY_HUB_ISSUER`, `IDENTITY_HUB_CLIENT_ID`, and `IDENTITY_HUB_CLIENT_SECRET`.
Without a client, the variables hold their off values, `IDENTITY_HUB_CLIENT_ID=no-hub`, and the
page has only the guest button.

## In development

The production deploy is the proof. After one deploy to `main` and the first run of
`pnpm run deploy:dev`, run `pnpm run identity-hub:dev-client --stage dev-<your name>` once. That
stage of the stack gives the development deployment that `.env.local` selects a client of the hub,
with the app's initial access token that the production deploy saved, and writes the three
variables; it creates nothing and pushes nothing. From then on `pnpm run dev` has the Sign in
button, and each sign-in keeps the client alive. Run the stage again if the development deployment
was unused for two weeks and the button stopped working. `pnpm exec alchemy destroy --stage dev-<your name>`
deletes the client and keeps the deployment.

## How the hub verifies the app

The site serves `/samebase-verification.json` with the repository's numeric id,
`{ "repository": "123" }`, from the variable `SAMEBASE_REPOSITORY_ID`. The deploy sets it from
`GITHUB_REPOSITORY_ID`, and a `dev-` stage from the state of `prod`. The hub reads it at the site's
root, and registers the client on `<site>/auth/hub/callback` only when the id matches. A fork
serves its own id. An app on another host or callback path serves the same file at the root of its
origin, with the id that `gh api repos/<owner>/<name> --jq .id` prints, and lists its own address in
`redirectUris` of `IdentityHub.Client`.

The app's name at the hub is the stack's, `app` for a stack named after its repository. A user's ID
is the provider's own, such as `google:<id>`. An account is that ID. Name and email are profile
data, and accounts never link by email, so a guest who signs in with Google gets a new account.

## Terms, and running your own hub

The hub is a shared service under [Samebase's terms](https://samebase.com/terms), and Samebase can
block a repository or an owner that misuses it. To run your own instead, deploy the template
[samebase/identity-hub](https://github.com/samebase/identity-hub) and name its issuer in
`alchemy.run.ts`, host
[`@samebase/identity-broker`](https://github.com/samebase/samebase/tree/main/packages/identity-broker)
yourself, or connect your own auth.

## Deleting an account

The account page has **Delete account**, for guests too. `convex/account.ts` removes the user's
to-dos, profile, and logins, so an app with more tables of user data adds them there. Convex Auth
has no function for this yet, so `patches/` adds one.

## The Convex Auth version

Convex Auth is pinned to 2.0.0-beta.0 exactly because the adapter reaches its cookie-session
provider through a file that beta.0 does not export; see the
[adapter README](https://github.com/samebase/convex-hosting/tree/main/packages/convex-auth-tanstack-start#readme).
