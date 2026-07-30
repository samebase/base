/// <reference types="node" />
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const generatedJavaScriptPaths = new Set([
  "convex/_generated/api.js",
  "convex/_generated/server.js",
]);

const handwrittenSourceExtensions = new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts"]);

export function readPresentFilePaths(repoRoot: string): string[] {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .split("\0")
    .filter((filePath) => filePath.length > 0);
}

export function findHandwrittenJavaScript(filePaths: readonly string[]): string[] {
  return filePaths
    .filter(
      (filePath) =>
        handwrittenSourceExtensions.has(path.posix.extname(filePath)) &&
        !generatedJavaScriptPaths.has(filePath),
    )
    .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
}

export function checkTypeScriptSources(repoRoot: string): void {
  const handwrittenJavaScript = findHandwrittenJavaScript(readPresentFilePaths(repoRoot));
  if (handwrittenJavaScript.length === 0) {
    console.log("All present handwritten source files use TypeScript.");
    return;
  }

  throw new Error(
    `Handwritten source files must use normal .ts or .tsx extensions:\n${handwrittenJavaScript
      .map((filePath) => `- ${filePath}`)
      .join("\n")}`,
  );
}

function resolveRepoRoot(): string {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

function isDirectEntry(moduleUrl: string, entryPath = process.argv[1]): boolean {
  if (!entryPath) {
    return false;
  }

  return realpathSync(path.resolve(entryPath)) === realpathSync(fileURLToPath(moduleUrl));
}

if (isDirectEntry(import.meta.url)) {
  try {
    checkTypeScriptSources(resolveRepoRoot());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
