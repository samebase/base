<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Startup

- Install Vite+ once to supply Node.js, then run `corepack enable` to make pnpm available.
- Use `pnpm run dev` for normal development. It selects the primary or linked-worktree flow.
- Vite+ stays in `package.json` and supplies the dev, format, lint, test, and build tools behind the
  package scripts.

## Samebase starter source

A `Samebase source build: v<N>` line records the Samebase starter build used for that file. Do not
remove the line when you edit the file.

## Cross-platform automation

- The core workflow must run natively on macOS, Linux, and Windows.
- Put non-trivial repository automation in erasable TypeScript under `scripts/` and run it with the
  Node 24 runtime pinned by `.node-version`.
- Do not add Bash scripts, POSIX-only inline environment assignment, shell parameter expansion, or
  required Unix-only utilities. Set `env` and `cwd` through Node process APIs, pass arguments as
  arrays, and handle Windows `.cmd` entry points explicitly when needed.
- Documentation must use platform-neutral commands or show both POSIX and PowerShell forms when
  their syntax differs.

## Project validation

- Authored application, automation, test, and supported configuration source uses normal `.ts` or
  `.tsx`. Treat an authored `.js`, `.mjs`, or `.cjs` file as a review smell. Keep one only when a
  named tool or runtime cannot use TypeScript, and document that exact boundary. Generated output
  and required shipped browser artifacts can be valid exceptions. Do not add a repository-wide
  extension scanner.
- Run `pnpm run check`. It checks formatting, lint, browser TypeScript, Node TypeScript, Convex
  TypeScript, tests, and generated Cloudflare redirects.
- Run `pnpm run build` before a deploy. The real Cloudflare build path runs the complete check before
  it builds the app.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
