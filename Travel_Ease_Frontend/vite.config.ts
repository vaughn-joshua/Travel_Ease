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
    // Increase warning limit (Leaflet maps are inherently large ~700KB)
    chunkSizeWarningLimit: 750,
    // Manual chunk splitting for better caching and smaller initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Map libraries (large)
          'vendor-leaflet': ['leaflet', 'react-leaflet', 'leaflet-routing-machine'],
          // Data fetching
          'vendor-query': ['@tanstack/react-query'],
          // Form handling
          'vendor-forms': ['react-hook-form'],
          // Supabase auth
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
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

