<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

For local development in Codex web, default to `vp run dev`. This repo configures
that script to start Convex with `CONVEX_AGENT_MODE=anonymous`, so Codex should
not ask for an env key before trying the app.

If Codex web exposes environment toggles, keep internet access enabled. If it
offers a manual setup script, use `vp install`.

Use `vp run dev:auth` only when an authenticated Convex session is explicitly
needed.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->
