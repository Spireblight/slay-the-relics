import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        VideoOverlay: resolve(__dirname, "video_overlay.html"),
      },
      output: {
        // Vite will output HTML to dist by default
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    open: "/video_overlay.html",
    port: 8080,
  },
  preview: {
    port: 8080,
  },
});
