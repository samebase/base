# Fast setup

Go into Codex and paste:

`https://github.com/noter-md/convex-cloudflare-pages-stack`

If you are doing this manually, this repo is meant to be a simple app stack for:

- GitHub for source control
- Convex for data and backend logic
- Cloudflare Pages for the frontend deploy

It is designed to stay cheap, small, and easy to understand.

## Prerequisites

- `gh`
- `node@24`
- `pnpm`
- Cloudflare access

Convex and the other local binaries are installed through the repo.

## Codex web default

In Codex web:

- enable internet access so dependency install, Convex bootstrap, and deploy
  tooling can work normally
- if Codex asks for a manual setup script, use `vp install`
- start the app with `vp run dev`

That script defaults Convex to anonymous mode, so Codex can bootstrap and run
the project without asking for an env key first.

Use `vp run dev:auth` only when you intentionally want the logged-in Convex
flow.

## Manual setup

1. Create a new repo from the template:
   `https://github.com/new?owner=<your_github_org_or_username>&template_name=convex-cloudflare-pages-stack&template_owner=noter-md`
2. Clone it locally with `gh repo clone <username>/<app_name>`.
3. Run `vp install`.
4. Run `vp run dev`.
5. Let Convex bootstrap in anonymous mode by default, or use `vp run dev:auth`
   if you want the logged-in flow instead.
6. Set up Cloudflare Pages for the repo.
7. Use build command `vp run build`.
8. Use output directory `dist`.

## Free tier notes

- Convex pricing: `https://www.convex.dev/pricing`
- Cloudflare Pages: `https://pages.cloudflare.com/`

This stack is based on the same approach we use for `https://noter.md`.

## Trust the history

The git history is intentionally split into small commits so each step has one
clear purpose.

See:

- `https://github.com/noter-md/convex-cloudflare-pages-stack/commits/main/`
- `./REPO_HISTORY.md`
