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

## 3. add Tailwind CSS

```sh
vp add tailwindcss @tailwindcss/vite
```

update `./vite.config.ts` to import `@tailwindcss/vite` and add `tailwindcss()`
to the Vite plugin list while keeping the TanStack Router plugin before the
React plugin

create `./src/style.css` with

```css
@import "tailwindcss";
```

import `./style.css` from `./src/main.tsx`

## 6. add the @/\* import alias

update `./tsconfig.json` to add the `@/*` path alias

update `./vite.config.ts` to add the `@` alias with
`fileURLToPath(new URL("./src", import.meta.url))`

## 7. initialize shadcn/ui

```sh
vp dlx shadcn@latest init --base radix --preset nova --yes
```

this creates `./components.json`

this creates `./src/lib/utils.ts` with the `cn()` helper

this updates `./src/style.css` with the shadcn Nova preset, font import, theme
tokens, and base layer

## 8. enforce Oxc formatting in VS Code

update `./.vscode/settings.json` to add a language-scoped formatter override for
the common web file types so format on save still uses `oxc.oxc-vscode` even if
the user has conflicting formatter settings elsewhere
