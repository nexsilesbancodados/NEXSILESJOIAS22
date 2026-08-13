import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Substitui `rls-simulation.test.ts` e `multitenancy.test.ts`.
 *
 * Aqueles dois definiam um `RLSSimulator` e funções de organização dentro do
 * próprio arquivo e testavam esses objetos — 25 testes que passariam com o
 * banco sem uma única policy e com o app inteiro apagado.
 *
 * RLS mora no banco e não dá para verificar por teste unitário. O que dá — e é
 * onde o bug real aconteceu — é garantir as invariantes do lado do aplicativo:
 * que os dados da loja sejam consultados pela organização, não pelo usuário que
 * está logado.
 *
 * O caso concreto que motivou este arquivo: `pontos_fidelidade` tinha RLS
 * `USING (user_id = auth.uid())` e o hook filtrava por `user_id`. Numa loja com
 * duas vendedoras, o mesmo cliente acabava com dois saldos de pontos que
 * ninguém somava.
 */

const raiz = process.cwd();
const ler = (p: string) => fs.readFileSync(path.join(raiz, p), "utf8");

/** Tabelas que pertencem à LOJA — nunca podem ser filtradas por user_id. */
const TABELAS_DA_LOJA = [
  "pontos_fidelidade",
  "niveis_fidelidade",
  "recompensas_fidelidade",
  "historico_precos",
];

function arquivosDeCodigo(dir: string, acc: string[] = []): string[] {
  for (const entrada of fs.readdirSync(path.join(raiz, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === "test") continue;
      arquivosDeCodigo(rel, acc);
    } else if (/\.(ts|tsx)$/.test(entrada.name)) {
      acc.push(rel);
    }
  }
  return acc;
}

describe("invariantes de multi-tenancy", () => {
  const fontes = arquivosDeCodigo("src").map((f) => ({ arquivo: f, texto: ler(f) }));

  it.each(TABELAS_DA_LOJA)(
    "%s é consultada pela organização, nunca por user_id",
    (tabela) => {
      const infratores: string[] = [];

      for (const { arquivo, texto } of fontes) {
        // Recorta cada cadeia que começa em .from('<tabela>') e vai até o fim
        // da instrução, para checar apenas os filtros daquela consulta.
        const re = new RegExp(`\\.from\\(['"\`]${tabela}['"\`]\\)[\\s\\S]{0,600}?;`, "g");
        let m: RegExpExecArray | null;
        while ((m = re.exec(texto))) {
          if (/\.eq\(\s*['"`]user_id['"`]/.test(m[0])) {
            const linha = texto.slice(0, m.index).split("\n").length;
            infratores.push(`${arquivo}:${linha}`);
          }
        }
      }

      expect(infratores, `filtro por user_id em ${tabela}`).toEqual([]);
    },
  );

  it("o saldo de pontos é movimentado pela RPC atômica, não por UPDATE calculado no cliente", () => {
    const fidelidade = ler("src/hooks/useFidelidade.ts");

    // A RPC resolve leitura, cálculo e gravação numa transação só.
    expect(fidelidade).toContain("ajustar_pontos_fidelidade");

    // E não pode voltar o padrão SELECT → soma em JS → UPDATE absoluto, que
    // perde uma das gravações quando duas telas mexem no mesmo cliente.
    expect(fidelidade).not.toMatch(/pontos_disponiveis\s*[-+]\s*quantidade/);
  });

  it("o estoque também é movimentado por RPC atômica", () => {
    const estoque = ler("src/lib/estoque.ts");
    expect(estoque).toContain("ajustar_estoque_peca");
    expect(estoque).toContain("p_delta");
  });

  it("a migration de fidelidade impede saldo duplicado por cliente", () => {
    const migration = ler(
      "supabase/migrations/20260812200500_fidelidade_por_organizacao.sql",
    );

    // Índice único: mesmo sob concorrência, um cliente tem um saldo só.
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX[\s\S]*?pontos_fidelidade\s*\(organization_id, cliente_id\)/,
    );
    // E o RLS passou a ser por organização.
    expect(migration).toContain("pontos_fidelidade_select_org");
    expect(migration).toContain("get_user_organization_id()");
  });
});
