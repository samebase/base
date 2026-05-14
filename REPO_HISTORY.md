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

## 4. add the @/\* import alias

```sh
vp run build
```

Add the `@/*` TypeScript path alias and the matching Vite alias so generated
shadcn/ui imports use the same shape as the current `notermd/app` template.

## 5. initialize shadcn/ui

```sh
vp add @fontsource-variable/geist class-variance-authority clsx lucide-react radix-ui shadcn tailwind-merge tw-animate-css
pnpm approve-builds msw
vp run build
```

Add the shadcn Nova preset foundation:

- `components.json`
- `src/lib/utils.ts`
- shadcn theme imports and CSS variables in `src/style.css`

This commit prepares the theme and `cn()` helper, but does not add concrete UI
primitives yet.
