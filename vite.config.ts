import { convexAuth } from "@samebase/convex-auth-tanstack-start/vite";
import { convexSsr } from "@samebase/convex-hosting-tanstack-start/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: [".agents/**", "convex/_generated/**", "src/routeTree.gen.ts"],
  },
  lint: {
    ignorePatterns: [".agents/**", "convex/_generated/**", "src/routeTree.gen.ts"],
    options: { typeAware: true },
  },
  plugins: [
    tailwindcss(),
    convexSsr(),
    convexAuth(),
    // Prerenders /about only, into a file of the build. `prerender: { enabled: true }` would also
    // prerender every static route, and crawling would follow /about's links. The header marks the
    // prerender's requests for src/server.ts; a prerender renders without a visitor.
    tanstackStart({
      prerender: { headers: { "x-prerender": "1" } },
      pages: [{ path: "/about", prerender: { enabled: true, crawlLinks: false } }],
    }),
    react(),
  ],
  staged: {
    "*": "vp check --fix",
  },
});
