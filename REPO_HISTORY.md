## 1. initialize vite plus application

```sh
vp create vite:application \
  --directory app-start-workers \
  --agent codex \
  --editor vscode \
  --hooks \
  --no-interactive \
  --verbose
```

## 2. add React and TanStack Start manually

```sh
vp add react react-dom @tanstack/react-router @tanstack/react-start
vp add -D @tanstack/router-plugin @types/node @types/react @types/react-dom @vitejs/plugin-react
vp build
vp run build
```

Replace the generated Vite demo with a small TanStack Start route shell:

- remove `index.html`
- remove the generated Vite demo files under `src/`
- create `src/router.tsx`
- create `src/routes/__root.tsx`
- create `src/routes/index.tsx`
- create `src/routes/about.tsx`

TanStack Start is configured in SPA mode, with `/index.html` as the prerendered
shell for static hosting.

## 3. add Tailwind CSS

```sh
vp add tailwindcss @tailwindcss/vite
vp run build
```

Add the Tailwind Vite plugin and import Tailwind from `src/style.css`. The app
still uses plain CSS classes at this step; Tailwind is present before shadcn/ui
so the styling layers stay easy to inspect.

## 4. add package import aliases

```sh
vp run build
```

Add Node package imports for app-internal aliases instead of a TypeScript
`@/*` path alias. The mapping lives in `package.json` `imports`:

- `#components/*`, `#lib/*`, and `#hooks/*` map into `src/`
- TypeScript, Vite, and shadcn resolve the same specifiers, so there is no
  duplicate `compilerOptions.paths` or Vite `resolve.alias` entry
- named roots are used because Node 22 rejects `#/...` specifiers

`docs/package-imports.md` records the research behind this choice.

## 5. initialize shadcn/ui

```sh
vp add class-variance-authority clsx lucide-react radix-ui shadcn tailwind-merge tw-animate-css
pnpm approve-builds msw
vp run build
```

Add the shadcn Nova preset foundation:

- `components.json`
- `src/lib/utils.ts`
- shadcn theme imports and CSS variables in `src/style.css`
- a system `--font-sans` stack, so the starter has no webfont swap on first load
- a pointer cursor on enabled buttons, which Tailwind v4 no longer applies by
  default

This commit prepares the theme and `cn()` helper, but does not add concrete UI
primitives yet.

## 6. enforce Oxc formatting in VS Code

```sh
vp run build
```

Force common web file types to use the Oxc VS Code formatter. The setting is
tracked even though the generated Vite `.gitignore` ignores most `.vscode`
files, because this template wants format-on-save to match the project.

## 7. add the shadcn primitives we need

```sh
vp exec shadcn add button checkbox input --yes
vp run build
```

Generate the same UI primitives used by the starter todo UI:

- `src/components/ui/button.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/input.tsx`

No product UI changes yet; this keeps generated primitive code separate from
the app example.

## 8. add Convex

```sh
vp add convex
pnpm approve-builds esbuild
CONVEX_AGENT_MODE=anonymous vp exec convex dev --once --typecheck=disable
vp run build
```

Add Convex as the backend layer while keeping the first backend state empty:

- `convex.json` disables Convex AI files for this step
- `convex/schema.ts` starts with an empty schema
- `src/lib/convex.tsx` wires the React provider at the route root
- generated Convex bindings under `convex/_generated/` are committed

The app can run with a real `VITE_CONVEX_URL`, and shows a small setup message
when that environment variable is missing.

## 9. add Convex AI files

```sh
vp exec convex ai-files install
vp run build
```

Enable Convex AI files for Codex and install the generated guidance files. This
adds the agent instructions, Convex AI guidelines, and the generated skills lock
so future agents know how to work inside the Convex backend.

## 10. add the todo example

```sh
vp exec convex codegen --typecheck=disable
vp run build
```

Add the first real app behavior:

- `convex/schema.ts` defines the `todos` table
- `convex/todos.ts` exposes list, create, and toggle functions
- `src/routes/index.tsx` renders the todo UI with Convex hooks
- the root and about routes switch to the shadcn-styled app shell

The Convex bindings are regenerated after the schema and functions are added.
