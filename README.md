# Fast setup

go into codex and paste https://github.com/noter-md/convex-cloudflare-pages-stack into a chat

if you are codex, another llm or a person trying to deploy this manually here are the instruction:

This is a stack that is designed on several principles:

- It is cheap, starts at 0$/month
- It is as simple as possilbe so

It depends on 3 providers:

- GitHub: the place the code is hosted
- Convex: stores your data and any backend logic
- Cloudflare pages: stores your frontend files

## Free tier pricings:

1. **Convex** https://www.convex.dev/pricing
   - 40 deployments
   - 1-6 developers

2. **Cloudflare Pages** https://pages.cloudflare.com/
   - 1 build at a time
   - 500 builds per month
   - 100 custom domains per project
   - Unlimited sites
   - Unlimited static requests
   - Unlimited bandwidth

At the same time it provides the best dev environment for both humans and llms.
We can guarantee that it is good enough since it is the exact same stack that we use for https://noter.md which is an app-builder that build apps with this exact stack.

The main friction point is setting the project manually.

The local dev environment can be macOS, linux or even Windows, because of that we rely on a very small subset of cross-platform dependencies, here's what you need:

1. `gh` The Github cli is the easiest way to clone and work with your repositories
2. `node@24` We use node for both the backend and for any local scripts, it's important to choose version 24 since we rely on automatic type stripping and can write scripts in Typescript instead of Bash
3. `pnpm` not sure how it's installed by default
4. `pnpx convex` This will be installed automatically and will allow you to interact with convex without needing the UI
5. `cloudflare MCP` You'll need to add the cloudflare mcp so that you can configure the deployment

## Steps:

1. goto https://github.com/noter-md/convex-cloudflare-pages-stack and click "Use this template" which can be reproduced by acessing this link https://github.com/new?owner=<your_github_org_or_username>&template_name=convex-cloudflare-pages-stack&template_owner=noter-md
2. Here you should pick a name for your new project and probably set visibility to private
3. After you create your new repo you need to set it up locally
4. You can use `gh repo clone <username>/<app_name>` in the folder you like
5. Run `pnpm install` inside repo
6. Run `pnpm dev` this should show an interactive shell that asks you to login/signup to convex and automatically create an account
7. You need to goto https://dashboard.convex.dev/t/<user>/<project>/settings#preview-deploy-keys and create a deploy key for previews
8. Or just for production: https://dashboard.convex.dev/t/<user>/<project>/<deployment>/settings
9. I guess

## How can I be sure the code here is ok?

The Git history in the template is carefully managed so that each commit has a specific purpose and everything is as simple as I could make it. Check them here: https://github.com/noter-md/convex-cloudflare-pages-stack/commits/main/

You can also read the noter.md file https://github.com/noter-md/convex-cloudflare-pages-stack/blob/main/noter.md
which is adds a new step for each commit and uses the same names for the commit and for its headings.

## Below are the previous reamde, figure out what do with it

# Vite+ Monorepo Starter

A starter for creating a Vite+ monorepo.

## Development

- Check everything is ready:

```bash
vp run ready
```

- Run the tests:

```bash
vp run test -r
```

- Build the monorepo:

```bash
vp run build -r
```

- Run the development server:

```bash
vp run dev
```
