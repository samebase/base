export type CloudflarePrerenderPage = {
  path: `/${string}`;
  outputPath: `/${string}`;
  redirectAliases: readonly [`/${string}`, ...`/${string}`[]];
};

/**
 * Public pages that are prerendered as exact Cloudflare Static Assets aliases.
 * /index.html belongs to Cloudflare's SPA fallback shell, so / is emitted as
 * /_home.html and exposed through the generated _redirects block.
 */
export const cloudflarePrerenderPages = [
  {
    path: "/",
    outputPath: "/_home.html",
    redirectAliases: ["/"],
  },
  {
    path: "/about",
    outputPath: "/about/index.html",
    redirectAliases: ["/about", "/about/", "/about/index.html"],
  },
] as const satisfies readonly CloudflarePrerenderPage[];
