import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Base path for assets (use "/" for root deployment)
  base: "/",
  build: {
    // Output directory (Vercel expects "dist" by default)
    outDir: "dist",
    // Generate source maps for debugging (disable in prod if needed)
    sourcemap: false,
    // Ensure clean builds
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // Dev proxy for local development only
    // In production, Vercel rewrites handle /api/* routing
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    // Preview server port for testing production builds locally
    port: 4173,
  },
  optimizeDeps: {
    include: ["lucide-react"],
  },
});

