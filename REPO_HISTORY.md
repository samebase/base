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

## 9. add the shadcn primitives we need

```sh
vp dlx shadcn@latest add button checkbox input --yes
```

this creates:

- `./src/components/ui/button.tsx`
- `./src/components/ui/checkbox.tsx`
- `./src/components/ui/input.tsx`

## 10. add Convex

```sh
vp add convex@^1.35.1
```

create `./convex.json` with

```json
{
  "$schema": "./node_modules/convex/schemas/convex.schema.json",
  "aiFiles": {
    "enabled": false
  }
}
```

```sh
CONVEX_AGENT_MODE=anonymous vp exec convex dev --once
```

change `./package.json` scripts to

```json
    "dev": "vp exec convex dev --start \"vp run dev:frontend\"",
    "dev:anon": "CONVEX_AGENT_MODE=anonymous vp run dev",
    "dev:frontend": "vp dev",
```

wrap `RouterProvider` in `ConvexProvider` in `./src/main.tsx` and create the
`ConvexReactClient` with `import.meta.env.VITE_CONVEX_URL`

create `./convex/messages.ts` with a tiny `getWelcomeMessage` query

run the anonymous bootstrap again so `./convex/_generated` includes the new
`messages` function

also update `./vite.config.ts` so Vite+ formatting and linting ignore
`./convex/_generated/**`

commit the generated:

- `./convex/README.md`
- `./convex/tsconfig.json`
- `./convex/_generated/*`

read that query from `./src/routes/index.tsx` so the app proves the Convex
wiring works before adding the first real schema

## 11. add Convex AI files

replace

```json
{
  "$schema": "./node_modules/convex/schemas/convex.schema.json",
  "aiFiles": {
    "enabled": false
  }
}
```

with

```json
{
  "$schema": "./node_modules/convex/schemas/convex.schema.json",
  "aiFiles": {
    "skills": {
      "agents": ["codex"]
    }
  }
}
```

```sh
vp exec convex ai-files install
```

this updates the Convex section in `./AGENTS.md`

this creates `./CLAUDE.md`

this creates:

- `./convex/_generated/ai/ai-files.state.json`
- `./convex/_generated/ai/guidelines.md`
- `./skills-lock.json`

this installs the Convex skills under `./.agents/skills/`

also update `./vite.config.ts` so Vite+ formatting and linting ignore
`./.agents/**`

## 12. add the todo example

- remove `./convex/messages.ts`
- create `./convex/schema.ts`
- create `./convex/todos.ts`

update `./src/routes/index.tsx` to replace the placeholder Convex welcome
message with a small todo app wired to the generated shadcn primitives

update `./src/routes/__root.tsx` and `./src/routes/about.tsx` to match the
slightly more polished app shell used by the todo example

run `vp exec convex codegen` so `./convex/_generated/*` matches the new schema

## 13. Add onboarding instruction

create `./README.md` with a short onboarding guide for:

- creating a repo from the template
- cloning it locally
- running `vp install`
- running `vp run dev`
- using Cloudflare Pages with build output `./dist`
