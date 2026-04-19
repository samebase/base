import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: ["src/routeTree.gen.ts"],
  },
  lint: {
    ignorePatterns: ["src/routeTree.gen.ts"],
    options: { typeAware: true, typeCheck: true },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  staged: {
    "*": "vp check --fix",
  },
});
