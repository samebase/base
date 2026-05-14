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
