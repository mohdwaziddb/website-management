/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: abc.localhost:5173 -> /api proxy -> localhost:6900. Host header (abc.localhost) forward hota hai,
// isliye backend subdomain se tenant pehchanta hai — bilkul live nginx jaisa.
const backend = process.env.VITE_BACKEND_URL || "http://localhost:6900";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // custom domain test (hosts file: 127.0.0.1 xyz.test) ke liye koi bhi host
    allowedHosts: true,
    proxy: {
      "/api": { target: backend, changeOrigin: false },
      "/files": { target: backend, changeOrigin: false },
      // Google ke liye (live: nginx me same rewrite — README)
      "/sitemap.xml": { target: backend, changeOrigin: false, rewrite: () => "/api/public/sitemap.xml" },
      "/robots.txt": { target: backend, changeOrigin: false, rewrite: () => "/api/public/robots.txt" }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false
  },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("ckeditor")) return "editor";
          if (id.includes("node_modules")) return "vendor";
          return undefined;
        }
      }
    }
  }
});
