import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const root = import.meta.dirname;

export default defineConfig({
  root,
  base: "/print-app/",
  plugins: [react()],
  resolve: { alias: { "@": root } },
  build: {
    outDir: path.resolve(root, "../../public/print-app"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
});
