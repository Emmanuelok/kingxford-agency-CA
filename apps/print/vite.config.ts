import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { copyFile, cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { patchPdfRenderer } from "./lib/build/pdfjs-renderer-patch";

const root = import.meta.dirname;
const pdfDistribution = path.resolve(root, "../../node_modules/pdfjs-dist");
const pdfVersion = createRequire(import.meta.url)("pdfjs-dist/package.json").version as string;
const pdfRenderingErrors = {
  name: "avalon-pdf-rendering-errors",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    if (!/\/pdfjs-dist\/(?:legacy\/)?build\/pdf\.mjs$/.test(id.replace(/\\/g, "/"))) return null;
    return { code: patchPdfRenderer(code, pdfVersion), map: null };
  },
};

// Keep the renderer, fonts and image decoders on our own origin. Vite clears
// outDir first, so copy after output rather than into an erased prebuild folder.
const pdfAssets = {
  name: "avalon-pdf-assets",
  async closeBundle() {
    const destination = path.resolve(root, "../../public/print-app/pdfjs");
    await mkdir(destination, { recursive: true });
    await copyFile(path.join(pdfDistribution, "build/pdf.worker.min.mjs"), path.join(destination, "pdf.worker.min.mjs"));
    await copyFile(path.join(pdfDistribution, "LICENSE"), path.join(destination, "LICENSE"));
    await Promise.all(["cmaps", "standard_fonts", "iccs", "wasm"].map(directory => cp(path.join(pdfDistribution, directory), path.join(destination, directory), {
      recursive: true,
      // The form-scripting sandbox is never used by the artwork importer.
      filter: source => !path.basename(source).startsWith("quickjs-eval"),
    })));
  },
};

export default defineConfig({
  root,
  base: "/print-app/",
  plugins: [react(), pdfRenderingErrors, pdfAssets],
  optimizeDeps: { exclude: ["pdfjs-dist"] },
  resolve: { alias: { "@": root } },
  build: {
    outDir: path.resolve(root, "../../public/print-app"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
});
