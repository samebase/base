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
