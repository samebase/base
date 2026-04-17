1. initialize vite plus

```sh
vp create vite:monorepo \
  --directory convex-cloudflare-pages-stack \
  --package-manager pnpm \
  --agent chatgpt-codex \
  --editor vscode \
  --hooks \
  --no-interactive
```

2. simplify vp settings

```sh
rm -rf ./packages
pnpm install
```

remove `catalogMode: prefer` from `./pnpm-workspace.yaml`

update the root `./vite.config.ts` to ignore generated files in Vite Plus:

- `apps/website/convex/_generated/**`
- `apps/website/src/routeTree.gen.ts`

for both `fmt.ignorePatterns` and `lint.ignorePatterns`

3. add React and TanStack Router manually to `./apps/website`

keep the root `package.json` `"dev"` script as

```json
    "dev": "vp run website#dev",
```

edit `./apps/website/package.json` to add

```json
  "dependencies": {
    "@tanstack/react-router": "1.168.22",
    "react": "19.2.5",
    "react-dom": "19.2.5"
  },
  "devDependencies": {
    "@tanstack/router-plugin": "1.167.22",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.1"
  }
```

add `"jsx": "react-jsx"` to `./apps/website/tsconfig.json`

create `./apps/website/vite.config.ts` with the TanStack Router plugin before
the React plugin

change `./apps/website/index.html` to load `./src/main.tsx`

replace `./apps/website/src/main.ts` with `./apps/website/src/main.tsx` and
create the router with `routeTree`

create:

- `./apps/website/src/routes/__root.tsx`
- `./apps/website/src/routes/index.tsx`
- `./apps/website/src/routes/about.tsx`

delete:

- `./apps/website/src/counter.ts`
- `./apps/website/src/style.css`
- `./apps/website/src/assets/hero.png`
- `./apps/website/src/assets/typescript.svg`
- `./apps/website/src/assets/vite.svg`

from repo root

```sh
pnpm install
```

from `./apps/website`

```sh
vp build
```

from repo root

```sh
pnpm --filter website run build
```

commit the generated `./apps/website/src/routeTree.gen.ts`

4. add Convex

from `./apps/website`

```sh
pnpm add convex
```

create `./apps/website/convex.json` with

```json
{
  "$schema": "./node_modules/convex/schemas/convex.schema.json",
  "aiFiles": {
    "enabled": false
  }
}
```

from `./apps/website`

```sh
CONVEX_AGENT_MODE=anonymous pnpx convex dev --once
```

change `./apps/website/package.json` scripts to

```json
    "dev": "pnpx convex dev --start \"pnpm run dev:frontend\"",
    "dev:anon": "CONVEX_AGENT_MODE=anonymous pnpm run dev",
    "dev:frontend": "vp dev",
```

also add this root `./package.json` script:

```json
    "dev:anon": "vp run website#dev:anon",
```

wrap `RouterProvider` in `ConvexProvider` in `./apps/website/src/main.tsx` and
create the `ConvexReactClient` with `import.meta.env.VITE_CONVEX_URL`

create `./apps/website/convex/messages.ts` with a tiny `getWelcomeMessage`
query

run the anonymous bootstrap again so `./apps/website/convex/_generated`
includes the new `messages` function

commit the generated:

- `./apps/website/convex/README.md`
- `./apps/website/convex/tsconfig.json`
- `./apps/website/convex/_generated/*`

read that query from `./apps/website/src/routes/index.tsx` so the app proves
the Convex wiring works before adding the first real schema

5. add Tailwind CSS

from `./apps/website`

```sh
pnpm add tailwindcss @tailwindcss/vite
```

update `./apps/website/vite.config.ts` to import `@tailwindcss/vite` and add
`tailwindcss()` to the Vite plugin list while keeping the TanStack Router plugin
before the React plugin

create `./apps/website/src/style.css` with

```css
@import "tailwindcss";
```

import `./style.css` from `./apps/website/src/main.tsx`

6. add the `@/*` import alias

update `./apps/website/tsconfig.json` to add the `@/*` path alias

update `./apps/website/vite.config.ts` to add the `@` alias with
`fileURLToPath(new URL("./src", import.meta.url))`

7. initialize shadcn/ui

from `./apps/website`

```sh
pnpx shadcn@latest init --base radix --preset nova --yes
```

8. add shadcn/ui primitives

from `./apps/website`

```sh
pnpx shadcn@latest add button checkbox input
```
