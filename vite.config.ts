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
    allowedHosts: [
      'nexsales.store',
      'nexsiles.com.br',
      '.nexsiles.com.br',
      'nexsiles-nexsiles.uqxoid.easypanel.host',
    ],
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
  // Tira os console.log do site publicado sem mexer no código-fonte: em
  // desenvolvimento eles continuam (o driver da impressora, por exemplo, tem 26
  // deles e são úteis para diagnosticar problema de impressão no balcão).
  // console.warn e console.error ficam — são o que o suporte pede quando algo
  // dá errado.
  esbuild: {
    pure: mode === "production" ? ["console.log", "console.debug"] : [],
  },
}));
