export type CloudflarePrerenderPage = {
  path: `/${string}`;
  prerender: {
    enabled: true;
    outputPath?: `/${string}`;
  };
};

/**
 * Static public pages that TanStack Start prerenders and Cloudflare exposes
 * through exact _redirects aliases. Routes that need Convex use the SPA shell.
 */
export const cloudflarePrerenderPages = [
  {
    path: "/about",
    prerender: {
      enabled: true,
    },
  },
] as const satisfies readonly CloudflarePrerenderPage[];
