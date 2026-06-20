# Package imports research

Date: 2026-05-17

## Decision

Use package imports for app-internal source aliases in this template. The
mapping lives in `package.json#imports`, and TypeScript, Vite, Vite+, shadcn,
Bun, and Deno all have enough support for the pattern to be a good long-term
direction.

For this app, prefer shadcn's named roots:

```json
{
  "imports": {
    "#components/*": "./src/components/*.tsx",
    "#lib/*": "./src/lib/*.ts",
    "#hooks/*": "./src/hooks/*.ts"
  }
}
```

Do not use `#/*` as the catch-all spelling. It works in current Node 24, Bun,
and Deno, but Node 22 rejects `#/...` specifiers. Named roots such as
`#components/*`, `#lib/*`, `#hooks/*`, and `#src/*` avoid that runtime-version
edge.

## Findings

- Node defines package imports as private, package-local mappings that start
  with `#`.
- TypeScript resolves package imports by default under
  `moduleResolution: "bundler"`, so this app does not need a duplicate
  `compilerOptions.paths` alias.
- Vite 8 and Vite+ 0.1.18 both build a small package-imports fixture without a
  `resolve.alias` entry. Vite+ `vp check` also passed after formatting.
- Bun 1.3 and Deno 2.7 both resolved a package-imports fixture successfully.
- shadcn 4.7 reads package imports and generates the expected import spelling.
  With extension-specific targets, it emits extensionless imports such as
  `#lib/utils`.
- In monorepos, package imports are scoped to the package containing the source
  file. Use per-workspace `imports` for private app paths and package `exports`
  for shared workspace APIs.

## Samebase follow-up

Full Samebase has many more `@/...` imports and mixed `.ts` / `.tsx` files under
the same top-level folders. A future Samebase migration should either use explicit
source extensions with a broad `#src/*` mapping, or define named roots carefully
enough that each root maps to one source extension.

References:

- https://nodejs.org/api/packages.html#subpath-imports
- https://www.typescriptlang.org/tsconfig/resolvePackageJsonImports.html
- https://ui.shadcn.com/docs/package-imports
- https://ui.shadcn.com/docs/components-json
- https://bun.sh/docs/runtime/module-resolution
- https://docs.deno.com/runtime/fundamentals/node/
