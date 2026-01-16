import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "frontend"),
  build: {
    outDir: path.resolve(__dirname, "frontend/static/dist"),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, "frontend/src/main.ts"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
