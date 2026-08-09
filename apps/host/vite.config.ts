import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      formats: ["es"],
      fileName: "main",
    },
    rollupOptions: {
      external: [
        "node:http",
        "node:https",
        "node:fs",
        "node:path",
        "node:os",
        "node:crypto",
        "node:child_process",
        "node:events",
        "node:stream",
        "node:util",
      ],
    },
    target: "node20",
    ssr: true,
    outDir: "dist",
  },
  ssr: {
    noExternal: ["zod"],
  },
});
