import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    // O padrão de 5s não cobre este projeto.
    //
    // Testes de página fazem `await import()` da página, e o custo de compilar
    // a árvore inteira (PortalRevendedoraPage puxa boa parte do app) cai dentro
    // do orçamento do primeiro teste do arquivo — que media ~7s. Ele estourava,
    // e como o componente continuava montado, o teste SEGUINTE falhava com
    // "Found multiple elements". Daí a suíte passar ou falhar sem que nada no
    // código mudasse: dependia da máquina estar mais ou menos ocupada.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
