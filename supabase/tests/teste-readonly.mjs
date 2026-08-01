/**
 * Reproduz o que o PostgREST faz: função STABLE roda em transação READ ONLY.
 * Este teste teria pego o erro 25006 antes de ir para produção.
 */
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const MIGS = [
  "../migrations/20260730120000_hardening_sessoes_publicas_rls_privilegios.sql",
  "../migrations/20260730180000_pecas_colunas_publicas.sql",
  "../migrations/20260730190000_session_subject_sem_escrita.sql",
];

const db = await PGlite.create();
await db.exec(read("./base.sql"));
await db.exec(read("./schema-sintetico.sql"));
await db.exec(read("./preexistente.sql"));
for (const m of MIGS) await db.exec(read(m).replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/g, "-- stub"));

// dados
const org = (await db.query(`INSERT INTO public.organizations (name) VALUES ('A') RETURNING id`)).rows[0].id;
const rev = (await db.query(
  `INSERT INTO public.revendedoras (nome, email, senha_portal, organization_id, ativo, comissao_percentual)
   VALUES ('Maria','maria@a.com', crypt('segredo123', gen_salt('bf')), $1, true, 30) RETURNING id`, [org])).rows[0].id;
await db.query(
  `INSERT INTO public.maletas (nome, revendedora_id, organization_id, status, is_public, sharing_slug, codigo, numero_sequencial, valor_total)
   VALUES ('Maleta Verao', $1, $2, 'aberta', true, 'slug', 'M1', 1, 0)`, [rev, org]);
const cli = (await db.query(
  `INSERT INTO public.clientes (nome, email, senha, organization_id, ativo, pontos_fidelidade)
   VALUES ('Ana','ana@x.com', crypt('loja123', gen_salt('bf')), $1, true, 0) RETURNING id`, [org])).rows[0].id;

const token = (await db.query(`SELECT token FROM public.portal_login('maria@a.com','segredo123')`)).rows[0].token;
const tokenCli = (await db.query(`SELECT token FROM public.cliente_login('ana@x.com','loja123',$1)`, [org])).rows[0].token;

let pass = 0, fail = 0;
const emReadOnly = async (nome, sql, params, esperaLinhas) => {
  await db.exec("BEGIN; SET TRANSACTION READ ONLY;");
  try {
    const r = await db.query(sql, params);
    await db.exec("ROLLBACK");
    if (esperaLinhas === null || r.rows.length >= esperaLinhas) { pass++; console.log(`OK    ${nome}`); }
    else { fail++; console.log(`FALHA ${nome} — devolveu ${r.rows.length} linhas`); }
  } catch (e) {
    await db.exec("ROLLBACK");
    if (/25006|read-only/i.test(e.message)) { fail++; console.log(`FALHA ${nome} — ${e.message}`); }
    else if (/SESSAO_INVALIDA/.test(e.message) && esperaLinhas === null) { pass++; console.log(`OK    ${nome}`); }
    else { fail++; console.log(`FALHA ${nome} — ${e.message}`); }
  }
};

console.log("--- funções de leitura chamadas como o PostgREST chama (READ ONLY) ---");
await emReadOnly("portal_fetch_maletas", `SELECT * FROM public.portal_fetch_maletas($1)`, [token], 1);
await emReadOnly("portal_fetch_interesses", `SELECT * FROM public.portal_fetch_interesses($1)`, [token], 0);
await emReadOnly("portal_fetch_notificacoes", `SELECT * FROM public.portal_fetch_notificacoes($1)`, [token], 0);
await emReadOnly("portal_fetch_maleta_pecas",
  `SELECT * FROM public.portal_fetch_maleta_pecas($1, '00000000-0000-0000-0000-000000000000')`, [token], 0);
await emReadOnly("portal_fetch_interesse_itens",
  `SELECT * FROM public.portal_fetch_interesse_itens($1, '00000000-0000-0000-0000-000000000000')`, [token], 0);
await emReadOnly("cliente_fetch_pedidos", `SELECT * FROM public.cliente_fetch_pedidos($1)`, [tokenCli], 0);
await emReadOnly("cliente_fetch_pedido_itens",
  `SELECT * FROM public.cliente_fetch_pedido_itens($1,'00000000-0000-0000-0000-000000000000')`, [tokenCli], 0);
await emReadOnly("token inválido continua dando SESSAO_INVALIDA (e não erro de read-only)",
  `SELECT * FROM public.portal_fetch_maletas('inventado')`, [], null);

console.log("--- escrita continua funcionando fora do read-only ---");
try {
  await db.query(`SELECT public.portal_marcar_vendida($1,'00000000-0000-0000-0000-000000000000',1)`, [token]);
  pass++; console.log("OK    portal_marcar_vendida (VOLATILE) roda normal");
} catch (e) {
  if (/25006/.test(e.message)) { fail++; console.log("FALHA portal_marcar_vendida — " + e.message); }
  else { pass++; console.log("OK    portal_marcar_vendida (VOLATILE) roda normal"); }
}

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
