import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * Limpeza explícita entre testes.
 *
 * A suíte era instável: em execuções seguidas, sem nenhuma alteração de código,
 * `portal-fluxo.test.tsx` às vezes falhava com `getMultipleElementsFoundError`
 * ao procurar o botão "Entrar no portal" — sinal de que a árvore renderizada
 * pelo teste anterior continuava montada. Um CI que falha de forma aleatória
 * treina a equipe a ignorar o vermelho, e aí a falha real passa junto.
 *
 * A limpeza automática do Testing Library depende de `globals: true` e de o
 * arquivo importar o pacote no momento certo. Fazer isso aqui, de forma
 * explícita, não depende de nada disso.
 */
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
