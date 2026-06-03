export type CloudflarePrerenderPage = {
  path: `/${string}`;
  prerender: {
    enabled: true;
    outputPath?: `/${string}`;
  };
};

/**
 * Public pages that TanStack Start prerenders and Cloudflare exposes through
 * exact _redirects aliases. Cloudflare SPA mode owns /index.html, so / must
 * use a separate output file.
 */
export const cloudflarePrerenderPages = [
  {
    path: "/",
    prerender: {
      enabled: true,
      outputPath: "/_landing.html",
    },
  },
  {
    path: "/about",
    prerender: {
      enabled: true,
    },
  },
] as const satisfies readonly CloudflarePrerenderPage[];
