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
    options: { typeAware: true, typeCheck: true },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      pages: [
        {
          path: "/",
          prerender: {
            enabled: true,
            outputPath: "/_home.html",
          },
        },
        {
          path: "/about",
          prerender: {
            enabled: true,
          },
        },
      ],
      prerender: {
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        enabled: true,
      },
      spa: {
        enabled: true,
        // A trailing slash keeps the SPA shell prerender distinct from the /about page.
        maskPath: "/about/",
        prerender: {
          outputPath: "/index.html",
        },
      },
    }),
    react(),
  ],
  staged: {
    "*": "vp check --fix",
  },
});
