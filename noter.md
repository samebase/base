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
