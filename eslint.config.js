import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",

      // `any` vira aviso, não erro.
      //
      // Eram 684 ocorrências — 96% dos 715 erros que o lint acusava. Com esse
      // volume, ninguém rodava o lint e os ~30 erros que apontavam problema de
      // verdade ficavam enterrados. Como erro, a regra não era um portão: era
      // uma parede que todo mundo contornava.
      //
      // Como aviso, ela continua visível e o `npm run lint` volta a sair com
      // código 0 quando não há erro real — dá para usar em CI. Tipar de fato
      // esses pontos é trabalho gradual, arquivo por arquivo.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Edge Functions rodam em Deno, não no navegador.
    files: ["supabase/functions/**/*.ts"],
    languageOptions: { globals: { ...globals.deno } },
  },
);
