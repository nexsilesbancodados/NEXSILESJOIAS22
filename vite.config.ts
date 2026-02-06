import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    allowedHosts: ['nexsales.store', 'nexsiles-nexsiles.uqxoid.easypanel.host'],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "next-themes"],
  },
  optimizeDeps: {
    include: ["@tanstack/react-query"],
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
}));
