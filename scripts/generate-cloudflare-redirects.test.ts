import { describe, expect, it } from "vitest";

import {
  buildGeneratedRedirects,
  generatedRedirectsEndTag,
  generatedRedirectsStartTag,
  replaceGeneratedRedirectsBlock,
} from "./generate-cloudflare-redirects.ts";
import type { CloudflarePrerenderPage } from "./cloudflare-prerender-pages.ts";

describe("generate-cloudflare-redirects", () => {
  it("replaces only the tagged generated block", () => {
    const source = [
      "/legacy /new 301",
      generatedRedirectsStartTag,
      "/old /old.html 200",
      generatedRedirectsEndTag,
      "/external https://example.com 302",
      "",
    ].join("\n");

    expect(replaceGeneratedRedirectsBlock(source, "/ /_home.html 200\n")).toBe(
      [
        "/legacy /new 301",
        generatedRedirectsStartTag,
        "/ /_home.html 200",
        generatedRedirectsEndTag,
        "/external https://example.com 302",
        "",
      ].join("\n"),
    );
  });

  it("requires the generated block tags", () => {
    expect(() => replaceGeneratedRedirectsBlock("/ /_home.html 200\n", "")).toThrow(
      /must contain exactly one generated block/,
    );
  });

  it("rejects wildcard aliases in generated redirects", () => {
    const pages = [
      {
        path: "/docs",
        outputPath: "/docs/index.html",
        redirectAliases: ["/docs/*"],
      },
    ] as const satisfies readonly CloudflarePrerenderPage[];

    expect(() => buildGeneratedRedirects(pages)).toThrow(/must be an exact path/);
  });

  it("keeps Cloudflare SPA shell ownership of /index.html", () => {
    const pages = [
      {
        path: "/",
        outputPath: "/index.html",
        redirectAliases: ["/"],
      },
    ] as const satisfies readonly CloudflarePrerenderPage[];

    expect(() => buildGeneratedRedirects(pages)).toThrow(/cannot be \/index\.html/);
  });
});
