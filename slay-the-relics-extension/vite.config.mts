import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import mkcert from "vite-plugin-mkcert";

const useHttps = process.env.VITE_HTTPS === "true";
const devPort = Number(process.env.VITE_PORT) || 8080;

export default defineConfig({
  plugins: [...(useHttps ? [mkcert()] : []), react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        VideoOverlay: resolve(__dirname, "video_overlay.html"),
      },
      output: {},
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  base: "./",
  server: {
    host: "localhost",
    open: "/video_overlay.html",
    port: devPort,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL ?? "http://localhost:8888",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: devPort,
  },
});
