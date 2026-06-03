/// <reference types="node" />
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  cloudflarePrerenderPages,
  type CloudflarePrerenderPage,
} from "./cloudflare-prerender-pages.ts";

export const generatedRedirectsStartTag = "# @notermd/app-prerender-redirects:start";
export const generatedRedirectsEndTag = "# @notermd/app-prerender-redirects:end";

const redirectsFilePath = path.resolve("public/_redirects");
const maxCloudflareStaticRedirectRules = 2000;
const maxCloudflareRedirectRuleLength = 1000;

function countOccurrences(contents: string, needle: string) {
  return contents.split(needle).length - 1;
}

function assertExactRedirectPath(value: string, label: string) {
  if (!value.startsWith("/")) {
    throw new Error(`${label} must start with "/": ${value}`);
  }

  if (/[\s*:#?]/.test(value)) {
    throw new Error(
      `${label} must be an exact path without whitespace, wildcards, placeholders, query, or hash: ${value}`,
    );
  }
}

export function buildGeneratedRedirects(pages: readonly CloudflarePrerenderPage[]) {
  const rules: string[] = [];
  const aliases = new Map<string, string>();

  for (const page of pages) {
    assertExactRedirectPath(page.path, `Prerender path for ${page.path}`);

    const outputPath = page.outputPath;
    assertExactRedirectPath(outputPath, `Prerender output for ${page.path}`);

    if (!outputPath.endsWith(".html")) {
      throw new Error(`Prerender output for ${page.path} must be an HTML file: ${outputPath}`);
    }

    if (outputPath === "/index.html") {
      throw new Error(
        `Prerender output for ${page.path} cannot be /index.html because Cloudflare SPA mode serves that file for unknown app routes.`,
      );
    }

    for (const alias of page.redirectAliases) {
      assertExactRedirectPath(alias, `Redirect alias for ${page.path}`);

      const existingPage = aliases.get(alias);
      if (existingPage) {
        throw new Error(
          `Redirect alias ${alias} is used by both ${existingPage} and ${page.path}.`,
        );
      }
      aliases.set(alias, page.path);

      const rule = `${alias} ${outputPath} 200`;
      if (rule.length > maxCloudflareRedirectRuleLength) {
        throw new Error(`Generated redirect rule for ${alias} is longer than Cloudflare's limit.`);
      }
      rules.push(rule);
    }
  }

  if (rules.length > maxCloudflareStaticRedirectRules) {
    throw new Error(
      `Generated ${rules.length} static redirect rules, which is more than Cloudflare's ${maxCloudflareStaticRedirectRules} rule limit.`,
    );
  }

  return [
    "# Cloudflare's single-page-application asset mode serves /index.html for",
    "# unknown app routes, so the SPA shell owns that file. These exact aliases",
    "# expose prerendered pages without catching hashed assets.",
    "",
    ...rules,
    "",
  ].join("\n");
}

export function replaceGeneratedRedirectsBlock(contents: string, generatedRedirects: string) {
  const startCount = countOccurrences(contents, generatedRedirectsStartTag);
  const endCount = countOccurrences(contents, generatedRedirectsEndTag);

  if (startCount !== 1 || endCount !== 1) {
    throw new Error(
      `public/_redirects must contain exactly one generated block: ${generatedRedirectsStartTag} ... ${generatedRedirectsEndTag}`,
    );
  }

  const startIndex = contents.indexOf(generatedRedirectsStartTag);
  const endIndex = contents.indexOf(generatedRedirectsEndTag);
  const startLineEnd = contents.indexOf("\n", startIndex);

  if (startLineEnd === -1 || endIndex <= startLineEnd) {
    throw new Error(`Generated redirects block is malformed in public/_redirects.`);
  }

  return `${contents.slice(0, startLineEnd + 1)}${generatedRedirects}${contents.slice(endIndex)}`;
}

export async function updateRedirectsFile(filePath = redirectsFilePath) {
  const contents = await readFile(filePath, "utf8");
  const generatedRedirects = buildGeneratedRedirects(cloudflarePrerenderPages);
  const nextContents = replaceGeneratedRedirectsBlock(contents, generatedRedirects);

  if (nextContents !== contents) {
    await writeFile(filePath, nextContents);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await updateRedirectsFile();
}
