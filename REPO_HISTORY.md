## 1. initialize vite plus application

```sh
vp create vite:application \
  --directory convex-cloudflare-pages-stack \
  --agent codex \
  --editor vscode \
  --hooks \
  --no-interactive \
  --verbose
```

track the generated `./.vscode` folder from the start

## 2. add React and TanStack Router manually

```sh
vp add react react-dom @tanstack/react-router
vp add -D @tanstack/router-plugin @types/react @types/react-dom @vitejs/plugin-react
```

replace the vanilla Vite entry with a small TanStack Router setup:

- change `./index.html` to load `./src/main.tsx`
- replace `./src/main.ts` with `./src/main.tsx`
- create `./src/routes/__root.tsx`
- create `./src/routes/index.tsx`
- create `./src/routes/about.tsx`
- remove `./src/counter.ts`
- remove `./src/style.css`
- remove the starter assets under `./src/assets`
- remove the unused `./public/icons.svg`

update `./tsconfig.json` to add `"jsx": "react-jsx"`

configure `./vite.config.ts` to use the TanStack Router plugin before the React plugin

```ts
tanstackRouter({
  target: "react",
  autoCodeSplitting: true,
});
```

also ignore the generated `./src/routeTree.gen.ts` in Vite+ formatting and linting

```sh
vp build
vp check
vp run build
```

the first `vp build` generates and lets us track `./src/routeTree.gen.ts`
