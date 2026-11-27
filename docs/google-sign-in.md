# Google sign-in

Guest sign-in always works. The home page also shows **Sign in**, which needs no Google project, no
key, and no registration. The button goes to the page of Samebase's identity broker,
`https://login.samebase.com`, which names the app's host and offers Google. The broker has no
GitHub sign-in yet.

## How the broker knows the app

The app's client id is the address of a JSON file on its own site, a
[Client ID Metadata Document](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/):
`<site>/oauth-client.json`, which `convex/http.ts` serves. It lists one return address,
`<site>/auth/hub/callback`, and the authentication method `none`: the app is a public client with
PKCE and no secret. The broker reads the file at a sign-in and keeps it for an hour.

Before each push, `scripts/ensure-convex-auth.ts` writes the file's address to the variable
`OAUTH_CLIENT_ID`, which `convex/convex.config.ts` gives to Convex Auth. The broker accepts only an
https file on a host name with no port, so a deployment on a custom domain deploys again after the
domain changes, and a local backend (`http://127.0.0.1`) cannot sign in.

## In development

`pnpm run dev` in the primary checkout uses a cloud development deployment with an https site, so
the button works there too: the broker returns to the deployment's site, and the site returns the
browser to the page on `localhost` that started the sign-in (the Samebase patch of Convex Auth in
`patches/` accepts any port of a loopback host). A linked worktree uses a local backend and has
only guest sign-in.

## Accounts

A user's ID is the provider's own, such as `google:<id>`. An account is that ID, the same at every
broker. Name and email are profile data, and accounts never link by email, so a guest who signs in
with Google gets a new account.

## Terms, and running your own broker

The broker is a shared service under [Samebase's terms](https://samebase.com/terms), and Samebase can
block a host that misuses it. To run your own instead, host
[`@samebase/identity-broker`](https://github.com/samebase/samebase/tree/main/packages/identity-broker)
with its Client ID Metadata Document layer, and name its issuer in `convex/auth.ts`.

## Deleting an account

The account page has **Delete account**, for guests too. `convex/account.ts` removes the user's
to-dos, profile, and logins, so an app with more tables of user data adds them there. Convex Auth
has no function for this yet, so `patches/` adds one.

## The Convex Auth version

Convex Auth is pinned to 2.0.0-beta.0 exactly because the adapter reaches its cookie-session
provider through a file that beta.0 does not export; see the
[adapter README](https://github.com/samebase/convex-hosting/tree/main/packages/convex-auth-tanstack-start#readme).
