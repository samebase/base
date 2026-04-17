import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: ["apps/website/convex/_generated/**", "apps/website/src/routeTree.gen.ts"],
  },
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    ignorePatterns: ["apps/website/convex/_generated/**", "apps/website/src/routeTree.gen.ts"],
    options: { typeAware: true, typeCheck: true },
  },
});
