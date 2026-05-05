# Local setup

Use this when you want to run the app from your own computer instead of only
through Cloudflare and Codex Cloud.

## Start with Codex

The easiest first step is not "install Node"; it is "ask Codex what this repo is
and let it guide the setup."

Open Codex in the macOS or Windows app, the IDE extension, the CLI, or Codex
Cloud. The official Codex quickstart is here:
[developers.openai.com/codex/quickstart](https://developers.openai.com/codex/quickstart).

Send this first message:

```text
What is https://github.com/notermd/app? Is it safe for me to run locally? Explain what accounts and tools it needs, then help me install Vite+ and start it.
```

That gives Codex permission to explain the repository before touching your
machine. It should tell you that this is a Vite+ React app with Convex as the
backend and Cloudflare Pages as the deployment target.

## Install Codex

For most people on macOS or Windows, install the Codex desktop app and sign in
with your ChatGPT account. The app can work in Local mode against a folder on
your machine.

If you prefer the terminal, the Codex CLI is supported on macOS, Windows, and
Linux. The official CLI install commands are:

```bash
npm install -g @openai/codex
```

or on macOS with Homebrew:

```bash
brew install codex
```

Then run:

```bash
codex
```

## Use GitHub App or gh

For Cloudflare Pages and Codex Cloud, prefer the GitHub App connection. It is
clearer than starting with SSH keys because GitHub shows which repositories the
app can access and lets you revoke that access later.

For local terminal work, prefer GitHub CLI (`gh`) with browser login. Official
install notes are in the GitHub CLI repo:
[macOS](https://github.com/cli/cli/blob/trunk/docs/install_macos.md) and
[Windows](https://github.com/cli/cli/blob/trunk/docs/install_windows.md).

Common installs:

```bash
brew install gh
```

```powershell
winget install --id GitHub.cli
```

Then authenticate and clone your copy of the repository:

```bash
gh auth login
gh repo clone your-github-name/your-app-repo
cd your-app-repo
```

SSH is still fine if you already manage SSH keys comfortably, but it is not the
friendliest first setup path.

## Install Vite+

Vite+ gives this repo a good Node environment and one project command surface.
Use it instead of manually choosing Node, pnpm, Vite, Vitest, and formatter
versions.

On macOS:

```bash
curl -fsSL https://vite.plus | bash
```

On Windows PowerShell:

```powershell
irm https://vite.plus/ps1 | iex
```

Open a new terminal after installing Vite+, then install dependencies:

```bash
vp install
```

## Run the normal local app

From the repository root:

```bash
vp run dev
```

`vp run dev` starts Convex and Vite together. On the first run, Convex may ask
you to sign in and choose or create a development deployment. Open the local URL
printed by Vite, usually `http://localhost:5173/`.

Do not use `vp dev` for the full app. `vp dev` is only Vite's frontend server.

## Run anonymous mode

Use anonymous mode for Codex, Conductor, T3Code, or a separate git worktree
where you want an isolated local backend.

```bash
vp run anon
```

This does the same thing as:

```bash
pnpm anon
```

Prefer `vp run anon` when Vite+ is installed because `vp run` is the project
toolchain wrapper. `pnpm anon` is the package-manager shorthand and is useful
when a tool already runs package scripts through PNPM.

This repo's `anon` script is a TypeScript launcher run by Node instead of
`CONVEX_AGENT_MODE=anonymous ...` shell syntax, so the same command works on
PowerShell, macOS, and Linux.

## Platform notes

macOS is the smoothest local path: Codex app, GitHub CLI, Vite+, and the browser
all live on the same machine.

Windows works well with PowerShell. Prefer the Codex app or CLI plus `gh` and
Vite+.

iPhone and iPad are best for using the hosted app, reviewing PRs, or driving
Codex Cloud in the browser. They are not the machine that runs Node, Vite, and
Convex in this setup.

Linux uses the same CLI commands as macOS, but in this workflow it is usually a
headless or terminal-first machine. Pair it with Codex CLI, Conductor, T3Code,
or a forwarded/tunneled browser URL when you need to click through the app.
