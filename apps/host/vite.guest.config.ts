import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname, "guest"),
  base: "/guest-assets/",
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist/guest"),
    emptyOutDir: true,
  },
});
