<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Cross-platform automation

- The core workflow must run natively on macOS, Linux, and Windows.
- Put non-trivial repository automation in erasable TypeScript under `scripts/` and run it with the
  Node 24 runtime pinned by `.node-version`.
- Do not add Bash scripts, POSIX-only inline environment assignment, shell parameter expansion, or
  required Unix-only utilities. Set `env` and `cwd` through Node process APIs, pass arguments as
  arrays, and handle Windows `.cmd` entry points explicitly when needed.
- Documentation must use platform-neutral commands or show both POSIX and PowerShell forms when
  their syntax differs.
