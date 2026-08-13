import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * Substitui `permissions.test.ts`, que definia funções de permissão dentro do
 * próprio arquivo e testava essas funções — passaria com o app inteiro apagado.
 * Aqui o alvo é o `usePermissions` de verdade: o mapa de módulos para rotas, o
 * atalho de admin e a negativa por ausência de permissão.
 */

const auth = vi.hoisted(() => ({ user: { id: "u1" } as { id: string } | null, isAdmin: false }));
const permissoesNoBanco = vi.hoisted(() => ({
  funcionario: { id: "f1" } as { id: string } | null,
  linhas: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

vi.mock("@/lib/supabase-db", () => ({
  supabase: {
    from: (tabela: string) => ({
      select: () => ({
        // `funcionarios` termina em .maybeSingle(); `funcionario_permissoes` é
        // aguardado direto no .eq(). O objeto abaixo atende os dois formatos.
        eq: () => {
          const resultado =
            tabela === "funcionarios"
              ? { data: permissoesNoBanco.funcionario, error: null }
              : { data: permissoesNoBanco.linhas, error: null };
          return {
            maybeSingle: async () => resultado,
            then: (resolver: (v: unknown) => unknown) => Promise.resolve(resultado).then(resolver),
          };
        },
      }),
    }),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function carregar() {
  const { usePermissions } = await import("@/hooks/usePermissions");
  const { result } = renderHook(() => usePermissions(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return result;
}

beforeEach(() => {
  auth.user = { id: "u1" };
  auth.isAdmin = false;
  permissoesNoBanco.funcionario = { id: "f1" };
  permissoesNoBanco.linhas = [];
  vi.resetModules();
});

describe("usePermissions", () => {
  it("admin acessa qualquer rota, mesmo sem linha de permissão", async () => {
    auth.isAdmin = true;
    const result = await carregar();

    expect(result.current.canAccessPath("/pecas")).toBe(true);
    expect(result.current.canAccessPath("/configuracoes")).toBe(true);
    expect(result.current.canDoAction("pecas", "excluir")).toBe(true);
  });

  it("nega rota quando não há permissão para o módulo", async () => {
    const result = await carregar();

    expect(result.current.canAccessPath("/pecas")).toBe(false);
    expect(result.current.canDoAction("pecas", "ver")).toBe(false);
  });

  it("libera a rota do módulo que o funcionário pode ver", async () => {
    permissoesNoBanco.linhas = [
      { modulo: "pecas", pode_ver: true, pode_criar: true, pode_editar: false, pode_excluir: false },
    ];
    const result = await carregar();

    expect(result.current.canAccessPath("/pecas")).toBe(true);
    expect(result.current.canDoAction("pecas", "criar")).toBe(true);
    // Ver não implica editar nem excluir.
    expect(result.current.canDoAction("pecas", "editar")).toBe(false);
    expect(result.current.canDoAction("pecas", "excluir")).toBe(false);
    // E não vaza para outro módulo.
    expect(result.current.canAccessPath("/clientes")).toBe(false);
  });

  it("nega tudo quando o módulo está marcado como não visível", async () => {
    permissoesNoBanco.linhas = [
      { modulo: "pecas", pode_ver: false, pode_criar: false, pode_editar: false, pode_excluir: false },
    ];
    const result = await carregar();

    expect(result.current.canAccessPath("/pecas")).toBe(false);
  });

  it("libera o tutorial sem depender de permissão", async () => {
    const result = await carregar();

    expect(result.current.canAccessPath("/tutorial")).toBe(true);
  });

  it("nega rota desconhecida em vez de liberar por omissão", async () => {
    const result = await carregar();

    // Uma rota fora do MODULE_PATH_MAP não pode virar acesso livre.
    expect(result.current.canAccessPath("/rota-que-nao-existe")).toBe(false);
  });

  it("trata /revendedoras/desempenho como parte do módulo revendedoras", async () => {
    const { default: fs } = await import("node:fs");
    const fonte = fs.readFileSync("src/hooks/usePermissions.ts", "utf8");

    // As duas rotas precisam estar no mesmo módulo; separá-las deixaria a
    // subpágina de desempenho acessível sem permissão de revendedoras.
    expect(fonte).toMatch(/revendedoras:\s*\['\/revendedoras',\s*'\/revendedoras\/desempenho'\]/);
  });
});
