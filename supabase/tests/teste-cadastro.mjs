/**
 * Fluxo de cadastro → conta criada → login, num Postgres real, com os gatilhos
 * de produção e as três migrations de hardening aplicadas.
 *
 * Cobre os dois caminhos da tela: cadastro com código de plano pago e cadastro
 * em modo teste (trial).
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
await db.exec(read("./triggers-signup.sql"));

let pass = 0, fail = 0;
const check = (nome, ok, detalhe = "") => {
  if (ok) { pass++; console.log(`OK    ${nome}`); }
  else { fail++; console.log(`FALHA ${nome}${detalhe ? " — " + detalhe : ""}`); }
};
const como = async (uid, email) => {
  await db.exec("RESET ROLE");
  await db.query(`select set_config('test.uid',$1,false)`, [uid ?? ""]);
  await db.query(`select set_config('test.email',$1,false)`, [email ?? ""]);
  await db.exec("SET ROLE authenticated");
};

// ===========================================================================
console.log("--- 1. compra: código de acesso emitido para o e-mail da compradora ---");
await db.query(
  `INSERT INTO public.codigos_acesso (codigo, email, plano, valor_pago, valido_ate, usado, periodo)
   VALUES ('LOJA12345678','nova@loja.com','nexsiles',129, now() + interval '30 days', false, 'mensal')`);

// a tela de cadastro valida o código pela Edge Function validate-access, que usa
// service_role — aqui a checagem equivalente:
const cod = (await db.query(
  `SELECT codigo, email, plano FROM public.codigos_acesso
    WHERE codigo='LOJA12345678' AND usado=false AND valido_ate > now()`)).rows[0];
check("código encontrado e válido para a tela de cadastro", !!cod && cod.email === "nova@loja.com");

console.log("\n--- 2. cadastro (o Supabase Auth cria o usuário e os gatilhos rodam) ---");
const novo = (await db.query(
  `INSERT INTO auth.users (email, raw_user_meta_data)
   VALUES ('nova@loja.com', '{"nome":"Joias da Nova"}'::jsonb) RETURNING id`)).rows[0].id;

await db.exec("RESET ROLE");
let r = await db.query(`SELECT nome, email FROM public.profiles WHERE user_id = $1`, [novo]);
check("perfil criado", r.rows.length === 1 && r.rows[0].nome === "Joias da Nova", JSON.stringify(r.rows));

r = await db.query(`SELECT o.name, o.owner_id FROM public.organizations o WHERE o.owner_id = $1`, [novo]);
check("organização criada com a dona certa", r.rows.length === 1, JSON.stringify(r.rows));
const orgId = r.rows[0]?.id ?? (await db.query(`SELECT id FROM public.organizations WHERE owner_id=$1`, [novo])).rows[0].id;

r = await db.query(`SELECT role FROM public.memberships WHERE user_id = $1`, [novo]);
check("vínculo de owner na organização", r.rows[0]?.role === "owner", JSON.stringify(r.rows));

r = await db.query(`SELECT role FROM public.user_roles WHERE user_id = $1`, [novo]);
check("papel admin concedido pelo gatilho (não pelo cliente)", r.rows[0]?.role === "admin", JSON.stringify(r.rows));

r = await db.query(`SELECT status FROM public.assinaturas WHERE user_id = $1`, [novo]);
check("assinatura do plano pago ativada no cadastro", r.rows[0]?.status === "ativo", JSON.stringify(r.rows));

r = await db.query(`SELECT usado, usado_por FROM public.codigos_acesso WHERE codigo='LOJA12345678'`);
check("código marcado como usado pela dona", r.rows[0]?.usado === true && r.rows[0]?.usado_por === novo);

r = await db.query(`SELECT email, origem FROM public.crm_leads WHERE email='nova@loja.com'`);
check("lead registrado no CRM", r.rows.length === 1 && r.rows[0].origem === "signup");

r = await db.query(`SELECT ativo FROM public.ecommerce_config WHERE organization_id = $1`, [orgId]);
check("loja virtual provisionada", r.rows.length === 1, `linhas: ${r.rows.length}`);

console.log("\n--- 3. primeiro login: o app precisa enxergar a própria conta ---");
await como(novo, "nova@loja.com");
r = await db.query(`SELECT nome FROM public.profiles`);
check("lê o próprio perfil", r.rows.length === 1 && r.rows[0].nome === "Joias da Nova", `linhas: ${r.rows.length}`);
r = await db.query(`SELECT name FROM public.organizations`);
check("lê a própria organização", r.rows.length === 1, `linhas: ${r.rows.length}`);
r = await db.query(`SELECT organization_id FROM public.memberships`);
check("lê o próprio vínculo", r.rows.length === 1, `linhas: ${r.rows.length}`);
r = await db.query(`SELECT role FROM public.user_roles`);
check("lê o próprio papel (o app usa isso para liberar as telas)", r.rows[0]?.role === "admin", JSON.stringify(r.rows));
r = await db.query(`SELECT status FROM public.assinaturas`);
check("lê a própria assinatura (guarda de plano)", r.rows[0]?.status === "ativo", JSON.stringify(r.rows));

let erro = null;
try {
  await db.query(`INSERT INTO public.user_consents (user_id, finalidade, versao, aceito)
                  VALUES ($1,'termos_de_uso','2026.07.28',true)`, [novo]);
} catch (e) { erro = e.message; }
check("grava o consentimento LGPD da tela de cadastro", !erro, erro || "");

console.log("\n--- 4. a rotina do app que reativa o código (useActivateSubscription) ---");
r = await db.query(`SELECT public.ativar_codigo_acesso('LOJA12345678') AS res`);
check("é idempotente: não duplica assinatura nem dá erro",
  r.rows[0].res.ok === true && r.rows[0].res.reaproveitado === true, JSON.stringify(r.rows[0].res));

console.log("\n--- 5. tentativas indevidas ---");
await db.exec('RESET ROLE');
const outro = (await db.query(
  `INSERT INTO auth.users (email, raw_user_meta_data) VALUES ('outra@loja.com','{"nome":"Outra"}'::jsonb) RETURNING id`)).rows[0].id;
await db.query(
  `INSERT INTO public.codigos_acesso (codigo, email, plano, valor_pago, valido_ate, usado, periodo)
   VALUES ('OUTRO1234567','terceiro@loja.com','nexsiles',129, now() + interval '30 days', false, 'mensal')`);
await como(outro, "outra@loja.com");
r = await db.query(`SELECT public.ativar_codigo_acesso('OUTRO1234567') AS res`);
check("não ativa código comprado por outra pessoa", r.rows[0].res.erro === "email_divergente", JSON.stringify(r.rows[0].res));

erro = null;
try { await db.query(`INSERT INTO public.user_roles (user_id, role) VALUES ($1,'admin')`, [outro]); }
catch (e) { erro = e.message; }
check("recém-cadastrada não consegue se dar mais um papel", !!erro, "inseriu sem erro");

erro = null;
try { await db.query(`UPDATE public.profiles SET is_super_admin = true WHERE user_id = $1`, [outro]); }
catch (e) { erro = e.message; }
check("recém-cadastrada não vira super admin", !!erro, "atualizou sem erro");

r = await db.query(`SELECT count(*)::int n FROM public.profiles`);
check("não enxerga a conta da outra loja", r.rows[0].n === 1, `viu ${r.rows[0].n} perfis`);

console.log("\n--- 6. cadastro em modo teste (trial), sem código ---");
await db.exec('RESET ROLE');
const trial = (await db.query(
  `INSERT INTO auth.users (email, raw_user_meta_data) VALUES ('trial@loja.com','{"nome":"Trial"}'::jsonb) RETURNING id`)).rows[0].id;
await como(trial, "trial@loja.com");
erro = null;
try {
  await db.query(
    `INSERT INTO public.assinaturas (user_id, plano, status, trial_ativo, trial_dias, data_inicio, data_vencimento, valor_mensal)
     VALUES ($1,'nexsiles','ativo',true,3, now(), now() + interval '3 days', 0)
     ON CONFLICT (user_id) DO UPDATE SET status='ativo'`, [trial]);
} catch (e) { erro = e.message; }
check("trial de 3 dias é criado pelo app", !erro, erro || "");
r = await db.query(`SELECT trial_ativo FROM public.assinaturas`);
check("e a conta enxerga o próprio trial", r.rows[0]?.trial_ativo === true, JSON.stringify(r.rows));

await db.exec("RESET ROLE");
console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
