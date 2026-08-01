/**
 * Testa a migration de colunas públicas de `pecas` num Postgres real:
 * visitante enxerga a vitrine, mas não o custo — e a view da loja
 * (security_invoker) continua funcionando.
 */
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const M1 = read("../migrations/20260730120000_hardening_sessoes_publicas_rls_privilegios.sql")
  .replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/g, "-- stub");
const M2 = read("../migrations/20260730180000_pecas_colunas_publicas.sql");

const db = await PGlite.create();
await db.exec(read("./base.sql"));
await db.exec(read("./schema-sintetico.sql"));
await db.exec(read("./preexistente.sql"));
await db.exec(M1);

// A vitrine da loja é uma view security_invoker: as colunas do SELECT E do
// WHERE dela precisam estar liberadas para o anon, senão a loja quebra.
await db.exec(`
  CREATE OR REPLACE VIEW public.pecas_loja_public WITH (security_invoker = on) AS
  SELECT p.id, p.nome, p.codigo, p.preco_venda, p.imagem_url, p.categoria, p.material,
         p.descricao, p.estoque, p.peso, p.organization_id
    FROM public.pecas p
   WHERE p.disponivel_loja = true AND p.ativo = true AND p.estoque > 0;
  GRANT SELECT ON public.pecas_loja_public TO anon, authenticated;
`);

await db.exec(M2);

const org = (await db.query(`INSERT INTO public.organizations (name) VALUES ('A') RETURNING id`)).rows[0].id;
await db.query(
  `INSERT INTO public.pecas (nome, codigo, preco_venda, preco_custo, estoque, organization_id, ativo, disponivel_loja)
   VALUES ('Anel','A1',100,40,5,$1,true,true)`, [org]);

let pass = 0, fail = 0;
const t = async (nome, fn, esperaErro) => {
  try {
    await fn();
    if (esperaErro) { fail++; console.log(`FALHA ${nome} — deixou passar`); }
    else { pass++; console.log(`OK    ${nome}`); }
  } catch (e) {
    if (esperaErro && /permission denied/i.test(e.message)) { pass++; console.log(`OK    ${nome}`); }
    else { fail++; console.log(`FALHA ${nome} — ${e.message}`); }
  }
};

await db.exec("SET ROLE anon");
await t("a vitrine da loja (view pecas_loja_public) continua funcionando", async () => {
  const r = await db.query(`SELECT nome, preco_venda FROM public.pecas_loja_public`);
  if (r.rows.length === 0) throw new Error("view devolveu 0 linhas");
}, false);
await t("anon lê nome e preço de venda", () => db.query(`SELECT nome, preco_venda FROM public.pecas LIMIT 1`), false);
await t("anon lê o conjunto da maleta pública",
  () => db.query(`SELECT id, nome, codigo, imagem_url, categoria, preco_venda, material FROM public.pecas LIMIT 1`), false);
await t("anon lê o conjunto do catálogo público (com estoque)",
  () => db.query(`SELECT id, nome, codigo, imagem_url, categoria, preco_venda, material, estoque FROM public.pecas LIMIT 1`), false);
await t("anon NAO le preco_custo", () => db.query(`SELECT preco_custo FROM public.pecas LIMIT 1`), true);
await t("anon NAO le preco_revenda", () => db.query(`SELECT preco_revenda FROM public.pecas LIMIT 1`), true);
await t("anon NAO le comissao_percentual_override", () => db.query(`SELECT comissao_percentual_override FROM public.pecas LIMIT 1`), true);
await t("anon NAO le fornecedor_id", () => db.query(`SELECT fornecedor_id FROM public.pecas LIMIT 1`), true);
await t("anon NAO consegue select *", () => db.query(`SELECT * FROM public.pecas LIMIT 1`), true);
await t("anon NAO filtra por custo (coluna no WHERE tambem e checada)",
  () => db.query(`SELECT id FROM public.pecas WHERE preco_custo > 0`), true);

await db.exec("RESET ROLE");
await db.exec("SET ROLE authenticated");
await t("usuario logado continua com select * (RLS filtra as linhas)",
  () => db.query(`SELECT * FROM public.pecas LIMIT 1`), false);
await db.exec("RESET ROLE");

try { await db.exec(M2); pass++; console.log("OK    roda duas vezes sem erro"); }
catch (e) { fail++; console.log("FALHA idempotencia — " + e.message); }

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
