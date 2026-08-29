// Samebase source build: v1989
/// <reference types="node" />
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const headerPrefix = "// Samebase starter dev launcher sha256:";
const launcherFiles = [
  {
    name: "run-context-dev.ts",
    path: fileURLToPath(new URL("./run-context-dev.ts", import.meta.url)),
  },
  {
    name: "run-primary-dev.ts",
    path: fileURLToPath(new URL("./run-primary-dev.ts", import.meta.url)),
  },
  {
    name: "run-worktree-dev.ts",
    path: fileURLToPath(new URL("./run-worktree-dev.ts", import.meta.url)),
  },
];

function readLauncherBody(filePath: string) {
  const source = readFileSync(filePath, "utf8").replaceAll("\r\n", "\n");
  const firstNewline = source.indexOf("\n");
  if (!source.startsWith(headerPrefix) || firstNewline < 0) {
    throw new Error(`${filePath} must start with ${headerPrefix}<hash>.`);
  }
  return source.slice(firstNewline + 1);
}

const launcherBodies = launcherFiles.map((file) => ({
  ...file,
  body: readLauncherBody(file.path),
}));
const hash = createHash("sha256");
for (const file of launcherBodies) {
  hash.update(file.name);
  hash.update("\0");
  hash.update(file.body);
  hash.update("\0");
}
const expectedHeader = `${headerPrefix}${hash.digest("hex")}`;
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--write")) {
  throw new Error("Usage: generate-dev-launcher-version.ts [--write]");
}
const shouldWrite = args[0] === "--write";

const staleFiles = launcherBodies.filter(
  (file) => readFileSync(file.path, "utf8").split(/\r?\n/, 1)[0] !== expectedHeader,
);
if (shouldWrite) {
  for (const file of staleFiles) {
    writeFileSync(file.path, `${expectedHeader}\n${file.body}`, "utf8");
  }
} else if (staleFiles.length > 0) {
  throw new Error(
    `Starter dev launcher version is stale. Run \`vp run generate:dev-launcher-version\`.`,
  );
}
