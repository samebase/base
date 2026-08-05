export type CloudflarePrerenderPage = {
  path: `/${string}`;
  prerender: {
    enabled: true;
    outputPath?: `/${string}`;
  };
};

/**
 * Static public pages that TanStack Start prerenders and Cloudflare exposes
 * through exact _redirects aliases.
 *
 * Cloudflare SPA mode always uses /index.html when no asset matches. The real
 * / route is also prerendered, so keep /index.html as the route-neutral shell
 * and write / to /_landing.html. public/_redirects exposes that file at exact
 * /. Revisit this split if Cloudflare supports a configurable SPA fallback
 * file or if this app moves to request-time SSR.
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
