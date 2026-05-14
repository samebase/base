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
