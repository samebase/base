# Local setup

Use this when you want to run the app from your own computer instead of only
through Cloudflare.

## Install Vite+

On macOS:

```sh
curl -fsSL https://vite.plus | bash
```

On Windows PowerShell:

```powershell
irm https://vite.plus/ps1 | iex
```

Open a new terminal after installing Vite+, then install dependencies:

```sh
pnpm install
```

## Run the app

From the repository root:

```sh
pnpm run dev
```

`pnpm run dev` starts Convex and TanStack Start together. On the first run,
Convex may ask you to sign in and choose or create a development deployment.
The dev script also creates Convex Auth JWT keys in that development deployment
if they are missing.

Open the local URL printed by Vite.

## Run worktree mode

Use worktree mode for Codex, Conductor, or a separate git worktree where you
want an isolated local backend.

```sh
pnpm run dev:worktree
```

This repo's `dev:worktree` script is a TypeScript launcher run by Node instead
of `CONVEX_AGENT_MODE=anonymous ...` shell syntax, so the same command works on
PowerShell, macOS, and Linux.
