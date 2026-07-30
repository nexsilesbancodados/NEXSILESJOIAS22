/**
 * Sobe um Postgres real (PGlite), monta o schema sintético + o estado
 * pré-existente do banco, aplica a migration de hardening e roda testes
 * funcionais de segurança contra ela.
 */
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const MIGRATION =
  "../migrations/20260730120000_hardening_sessoes_publicas_rls_privilegios.sql";

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

// PGlite não tem pgcrypto; base.sql stuba o contrato usado (crypt, gen_salt,
// digest, gen_random_bytes). Aqui só neutraliza a linha do CREATE EXTENSION.
const readMigration = () =>
  read(MIGRATION).replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/g, "-- pgcrypto stubado");

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = "") {
  if (ok) { pass++; results.push(`  OK   ${name}`); }
  else { fail++; results.push(`  FALHA ${name}${detail ? " — " + detail : ""}`); }
}

const db = await PGlite.create();

// ---------------------------------------------------------------- setup
try {
  await db.exec(read("./base.sql"));
  await db.exec(read("./schema-sintetico.sql"));
  await db.exec(read("./preexistente.sql"));
  console.log("Ambiente base montado.\n");
} catch (e) {
  console.error("FALHA ao montar o ambiente base:", e.message);
  process.exit(1);
}

// ------------------------------------------------------- aplica migration
try {
  await db.exec(readMigration());
  console.log("MIGRATION APLICADA SEM ERRO em Postgres real.\n");
} catch (e) {
  console.error("A MIGRATION FALHOU:", e.message);
  if (e.position) {
    const sql = readMigration();
    const pos = Number(e.position);
    console.error("linha ~", sql.slice(0, pos).split("\n").length);
    console.error("contexto:", JSON.stringify(sql.slice(Math.max(0, pos - 300), pos + 200)));
  }
  process.exit(1);
}

// ------------------------------------------------------------- dados de teste
const q = (sql, params) => db.query(sql, params);
const as = async (role, uid = null, email = null) => {
  await db.exec("RESET ROLE");
  await q("select set_config('test.uid', $1, false)", [uid ?? ""]);
  await q("select set_config('test.email', $1, false)", [email ?? ""]);
  await q("select set_config('test.role', $1, false)", [role === "anon" ? "anon" : role]);
  if (role !== "postgres") await db.exec(`SET ROLE ${role}`);
};

await db.exec("RESET ROLE");
const ids = (await q(`
  WITH orgA AS (
    INSERT INTO public.organizations (name) VALUES ('Org A') RETURNING id
  ), orgB AS (
    INSERT INTO public.organizations (name) VALUES ('Org B') RETURNING id
  ), uA AS (
    INSERT INTO auth.users (email) VALUES ('donoA@x.com') RETURNING id
  ), uB AS (
    INSERT INTO auth.users (email) VALUES ('donoB@x.com') RETURNING id
  ), uFunc AS (
    INSERT INTO auth.users (email) VALUES ('func@x.com') RETURNING id
  )
  SELECT (SELECT id FROM orgA) org_a, (SELECT id FROM orgB) org_b,
         (SELECT id FROM uA) user_a, (SELECT id FROM uB) user_b,
         (SELECT id FROM uFunc) user_func
`)).rows[0];

await q(`INSERT INTO public.memberships (user_id, organization_id, role) VALUES
  ($1,$2,'owner'), ($3,$4,'owner'), ($5,$2,'member')`,
  [ids.user_a, ids.org_a, ids.user_b, ids.org_b, ids.user_func]);

await q(`INSERT INTO public.profiles (user_id, nome, email) VALUES
  ($1,'Dono A','donoA@x.com'), ($2,'Dono B','donoB@x.com'), ($3,'Funcionario','func@x.com')`,
  [ids.user_a, ids.user_b, ids.user_func]);

await q(`INSERT INTO public.user_roles (user_id, role) VALUES ($1,'admin'), ($2,'admin')`,
  [ids.user_a, ids.user_b]);

// revendedoras (senha 'segredo123')
const rev = (await q(`
  INSERT INTO public.revendedoras (nome, email, senha_portal, organization_id, ativo, comissao_percentual)
  VALUES ('Maria A', 'maria@a.com', crypt('segredo123', gen_salt('bf')), $1, true, 30),
         ('Joana B', 'joana@b.com', crypt('outra456', gen_salt('bf')), $2, true, 25)
  RETURNING id, nome`, [ids.org_a, ids.org_b])).rows;
const revA = rev[0].id, revB = rev[1].id;

// peças + maletas
const pecas = (await q(`
  INSERT INTO public.pecas (nome, codigo, preco_venda, estoque, organization_id, ativo)
  VALUES ('Anel A','A001',100,10,$1,true), ('Colar B','B001',200,5,$2,true)
  RETURNING id`, [ids.org_a, ids.org_b])).rows;
const pecaA = pecas[0].id, pecaB = pecas[1].id;

const maletas = (await q(`
  INSERT INTO public.maletas (nome, revendedora_id, organization_id, status, is_public, sharing_slug, codigo, numero_sequencial, valor_total)
  VALUES ('Maleta A', $1, $2, 'aberta', true, 'slug-a', 'M001', 1, 0),
         ('Maleta B', $3, $4, 'aberta', true, 'slug-b', 'M002', 2, 0)
  RETURNING id`, [revA, ids.org_a, revB, ids.org_b])).rows;
const maletaA = maletas[0].id, maletaB = maletas[1].id;

const mp = (await q(`
  INSERT INTO public.maletas_pecas (maleta_id, peca_id, quantidade, quantidade_inicial, quantidade_devolvida, quantidade_perdida, quantidade_vendida, preco_unitario, vendida)
  VALUES ($1,$2,5,5,0,0,0,100,false), ($3,$4,3,3,0,0,0,200,false)
  RETURNING id`, [maletaA, pecaA, maletaB, pecaB])).rows;
const itemA = mp[0].id, itemB = mp[1].id;

// interesses (PII de cliente)
await q(`INSERT INTO public.maleta_interesses (maleta_id, cliente_nome, cliente_telefone, cliente_email, status)
         VALUES ($1,'Cliente da A','11999','c@a.com','pendente'),
                ($2,'Cliente da B','11888','c@b.com','pendente')`, [maletaA, maletaB]);

// clientes da loja (senha 'loja123')
const cli = (await q(`
  INSERT INTO public.clientes (nome, email, senha, organization_id, ativo, pontos_fidelidade)
  VALUES ('Ana','ana@x.com', crypt('loja123', gen_salt('bf')), $1, true, 0),
         ('Bia','bia@x.com', crypt('loja123', gen_salt('bf')), $2, true, 0)
  RETURNING id`, [ids.org_a, ids.org_b])).rows;

await q(`INSERT INTO public.ecommerce_pedidos
        (cliente_email, cliente_nome, organization_id, status, valor_total, valor_frete, valor_desconto, valor_subtotal, numero_pedido)
        VALUES ('ana@x.com','Ana',$1,'pago',150,10,0,140,1001),
               ('bia@x.com','Bia',$2,'pago',300,15,0,285,1002)`, [ids.org_a, ids.org_b]);

await q(`INSERT INTO public.purchases (name, email, cpf, phone, access_code, plan, payment_status)
         VALUES ('Comprador','comp@x.com','12345678900','11977','CODIGO123456','nexsiles','approved')`);

await q(`INSERT INTO public.codigos_acesso (codigo, email, plano, valor_pago, valido_ate, usado, periodo)
         VALUES ('ABCDEF123456','comprador@x.com','nexsiles',129, now() + interval '30 days', false, 'mensal')`);

console.log("Dados de teste inseridos.\n");

// =============================================================================
// TESTES
// =============================================================================

try {
// --- T1: login do portal -----------------------------------------------------
await as("anon");
let r = await q(`SELECT * FROM public.portal_login('maria@a.com','SENHA-ERRADA')`);
check("T1a senha errada não devolve sessão", r.rows.length === 0);

r = await q(`SELECT * FROM public.portal_login('naoexiste@x.com','qualquer')`);
check("T1b e-mail inexistente responde igual (sem oráculo)", r.rows.length === 0);

r = await q(`SELECT * FROM public.portal_login('maria@a.com','segredo123')`);
check("T1c senha correta abre sessão", r.rows.length === 1 && !!r.rows[0].token);
const tokenA = r.rows[0]?.token;
check("T1d login devolve a revendedora certa", r.rows[0]?.id === revA);

r = await q(`SELECT * FROM public.portal_login('joana@b.com','outra456')`);
const tokenB = r.rows[0]?.token;
check("T1e segunda revendedora também entra", !!tokenB);

// --- T2: token é obrigatório e não é adivinhável ------------------------------
let erro = null;
try { await q(`SELECT * FROM public.portal_fetch_maletas('token-inventado')`); }
catch (e) { erro = e.message; }
check("T2a token inválido é rejeitado", /SESSAO_INVALIDA/.test(erro || ""), erro || "não levantou");

erro = null;
try { await q(`SELECT * FROM public.portal_fetch_maletas(NULL)`); }
catch (e) { erro = e.message; }
check("T2b token nulo é rejeitado", /SESSAO_INVALIDA/.test(erro || ""), erro || "não levantou");

// o id da revendedora não serve mais como credencial
erro = null;
try { await q(`SELECT * FROM public.portal_fetch_maletas($1)`, [revA]); }
catch (e) { erro = e.message; }
check("T2c id da revendedora não vale como token", /SESSAO_INVALIDA/.test(erro || ""), erro || "não levantou");

// --- T3: isolamento entre revendedoras/tenants -------------------------------
r = await q(`SELECT * FROM public.portal_fetch_maletas($1)`, [tokenA]);
check("T3a portal vê só as próprias maletas", r.rows.length === 1 && r.rows[0].id === maletaA);

r = await q(`SELECT * FROM public.portal_fetch_maleta_pecas($1, $2)`, [tokenA, maletaB]);
check("T3b maleta de outro tenant devolve vazio", r.rows.length === 0);

r = await q(`SELECT * FROM public.portal_fetch_maleta_pecas($1, $2)`, [tokenA, maletaA]);
check("T3c peças da própria maleta vêm certas", r.rows.length === 1 && r.rows[0].peca_nome === "Anel A");

r = await q(`SELECT * FROM public.portal_fetch_interesses($1)`, [tokenA]);
check("T3d interesses: só os da própria revendedora",
  r.rows.length === 1 && r.rows[0].cliente_nome === "Cliente da A");

r = await q(`SELECT * FROM public.portal_fetch_notificacoes($1)`, [tokenB]);
check("T3e notificações: só as da própria revendedora",
  r.rows.length === 1 && r.rows[0].cliente_nome === "Cliente da B");

// --- T4: escrita no portal ---------------------------------------------------
r = await q(`SELECT public.portal_marcar_vendida($1, $2, 2) AS ok`, [tokenA, itemA]);
check("T4a marcar vendida na própria maleta funciona", r.rows[0].ok === true);

await db.exec("RESET ROLE");
r = await q(`SELECT quantidade, quantidade_vendida, vendida FROM public.maletas_pecas WHERE id = $1`, [itemA]);
await as("anon");
check("T4b baixa aplicada corretamente (5-2=3, vendidas=2)",
  r.rows[0].quantidade === 3 && r.rows[0].quantidade_vendida === 2 && r.rows[0].vendida === false,
  JSON.stringify(r.rows[0]));

r = await q(`SELECT public.portal_marcar_vendida($1, $2, 1) AS ok`, [tokenA, itemB]);
check("T4c não escreve em item de outro tenant", r.rows[0].ok === false);

erro = null;
try { await q(`SELECT public.portal_marcar_vendida($1, $2, 99) AS ok`, [tokenA, itemA]); }
catch (e) { erro = e.message; }
check("T4d não vende mais do que existe", /indisponível/i.test(erro || ""), erro || "não levantou");

r = await q(`SELECT public.portal_desfazer_venda($1, $2, 2) AS ok`, [tokenA, itemA]);
await db.exec("RESET ROLE");
r = await q(`SELECT quantidade, quantidade_vendida, vendida FROM public.maletas_pecas WHERE id = $1`, [itemA]);
await as("anon");
check("T4e desfazer venda restaura a quantidade",
  r.rows[0].quantidade === 5 && r.rows[0].quantidade_vendida === 0, JSON.stringify(r.rows[0]));

erro = null;
try { await q(`SELECT public.portal_desfazer_venda($1, $2, 3) AS ok`, [tokenA, itemA]); }
catch (e) { erro = e.message; }
check("T4f não desfaz mais do que foi vendido", /maior que/i.test(erro || ""), erro || "não levantou");

// --- T5: logout / expiração --------------------------------------------------
await q(`SELECT public.session_close($1)`, [tokenA]);
erro = null;
try { await q(`SELECT * FROM public.portal_fetch_maletas($1)`, [tokenA]); }
catch (e) { erro = e.message; }
check("T5a logout invalida o token", /SESSAO_INVALIDA/.test(erro || ""), erro || "não levantou");

await db.exec("RESET ROLE");
const t2 = (await q(`SELECT * FROM public.portal_login('maria@a.com','segredo123')`)).rows[0].token;
await q(`UPDATE public.public_sessions SET expires_at = now() - interval '1 hour'
          WHERE token_hash = public.session_hash($1)`, [t2]);
await as("anon");
erro = null;
try { await q(`SELECT * FROM public.portal_fetch_maletas($1)`, [t2]); }
catch (e) { erro = e.message; }
check("T5b token expirado é rejeitado", /SESSAO_INVALIDA/.test(erro || ""), erro || "não levantou");

// --- T6: token guardado só como hash ----------------------------------------
await db.exec("RESET ROLE");
r = await q(`SELECT count(*)::int AS n FROM public.public_sessions WHERE token_hash = $1`, [t2]);
check("T6 token em claro não fica no banco", r.rows[0].n === 0);

// --- T7: rate limit no login -------------------------------------------------
await as("anon");
erro = null;
try {
  for (let i = 0; i < 15; i++) await q(`SELECT * FROM public.portal_login('maria@a.com','errada')`);
} catch (e) { erro = e.message; }
check("T7 brute force barrado por rate limit", /MUITAS_TENTATIVAS/.test(erro || ""), erro || "não barrou");

// --- T8: área do cliente da loja --------------------------------------------
await as("anon");
r = await q(`SELECT * FROM public.cliente_login('ana@x.com','errada',$1)`, [ids.org_a]);
check("T8a cliente com senha errada não entra", r.rows.length === 0);

r = await q(`SELECT * FROM public.cliente_login('ana@x.com','loja123',$1)`, [ids.org_a]);
const tokenCli = r.rows[0]?.token;
check("T8b cliente entra e recebe token", !!tokenCli);

r = await q(`SELECT * FROM public.cliente_fetch_pedidos($1)`, [tokenCli]);
check("T8c cliente vê só os próprios pedidos",
  r.rows.length === 1 && Number(r.rows[0].valor_total) === 150, JSON.stringify(r.rows));

await db.exec('RESET ROLE');
const pedidoDaBia = (await q(`SELECT id FROM public.ecommerce_pedidos WHERE cliente_email='bia@x.com'`)).rows[0].id;
await as('anon');
r = await q(`SELECT * FROM public.cliente_fetch_pedido_itens($1,$2)`, [tokenCli, pedidoDaBia]);
check("T8d itens de pedido alheio devolvem vazio", r.rows.length === 0);

r = await q(`SELECT * FROM public.cliente_login('ana@x.com','loja123',$1)`, [ids.org_b]);
check("T8e login não atravessa organização", r.rows.length === 0);

// --- T9: assinaturas antigas removidas --------------------------------------
await db.exec("RESET ROLE");
const antigas = (await q(`
  SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname IN ('portal_login_lookup','portal_fetch_maletas','portal_fetch_maleta_pecas',
                       'portal_fetch_interesses','portal_fetch_interesse_itens','portal_marcar_vendida',
                       'portal_desfazer_venda','portal_update_interesse_status',
                       'fetch_cliente_pedidos','fetch_cliente_pedido_itens')
   ORDER BY 1`)).rows.map((x) => x.sig);
check("T9a portal_login_lookup foi removida", !antigas.some((s) => s.startsWith("portal_login_lookup")));
check("T9b nenhuma função do portal aceita mais uuid de revendedora",
  !antigas.some((s) => /portal_.*\(p_revendedora_id|portal_fetch_maleta_pecas\(p_maleta_id uuid, p_revendedora_id/.test(s)),
  antigas.join(" | "));
check("T9c fetch_cliente_pedidos por e-mail foi removida",
  !antigas.some((s) => s.startsWith("fetch_cliente_pedidos")));

// --- T10: RLS de purchases ---------------------------------------------------
// "bloqueado" pode ser 0 linhas (RLS) ou erro de permissão (GRANT revogado):
// os dois são aceitáveis, o que não pode é vazar linha.
const semAcesso = async (sql) => {
  try {
    const res = await q(sql);
    return Number(res.rows[0].n) === 0;
  } catch (e) {
    return /permission denied/i.test(e.message);
  }
};

await as("anon");
check("T10a anon não lê purchases (CPF/access_code)",
  await semAcesso(`SELECT count(*)::int AS n FROM public.purchases`));
await as("authenticated", ids.user_a, "donoA@x.com");
check("T10b usuário logado também não lê purchases",
  await semAcesso(`SELECT count(*)::int AS n FROM public.purchases`));
await as("anon");
check("T10c anon não lê a tabela de sessões",
  await semAcesso(`SELECT count(*)::int AS n FROM public.public_sessions`));

// --- T11: escalada de privilégio --------------------------------------------
await as("authenticated", ids.user_func, "func@x.com");
erro = null;
try { await q(`INSERT INTO public.user_roles (user_id, role) VALUES ($1,'admin')`, [ids.user_func]); }
catch (e) { erro = e.message; }
check("T11a funcionário não se promove a admin", !!erro, "inseriu sem erro");

erro = null;
try { await q(`UPDATE public.profiles SET is_super_admin = true WHERE user_id = $1`, [ids.user_func]); }
catch (e) { erro = e.message; }
check("T11b funcionário não se torna super admin", /is_super_admin/.test(erro || ""), erro || "atualizou sem erro");

// admin da mesma org PODE conceder role
await as("authenticated", ids.user_a, "donoA@x.com");
erro = null;
try { await q(`INSERT INTO public.user_roles (user_id, role) VALUES ($1,'gerente')`, [ids.user_func]); }
catch (e) { erro = e.message; }
check("T11c admin concede role a colega da mesma org", !erro, erro || "");

// admin de outra org NÃO pode
await as("authenticated", ids.user_b, "donoB@x.com");
erro = null;
try { await q(`INSERT INTO public.user_roles (user_id, role) VALUES ($1,'vendedor')`, [ids.user_func]); }
catch (e) { erro = e.message; }
check("T11d admin de outra org não concede role", !!erro, "inseriu sem erro");

// nome/telefone continuam editáveis (não quebrou o app)
await as("authenticated", ids.user_func, "func@x.com");
erro = null;
try { await q(`UPDATE public.profiles SET nome = 'Novo Nome' WHERE user_id = $1`, [ids.user_func]); }
catch (e) { erro = e.message; }
check("T11e editar o próprio nome continua funcionando", !erro, erro || "");

// service_role / SQL Editor ainda define o primeiro super admin
await db.exec("RESET ROLE");
await q("select set_config('test.uid','',false)");
erro = null;
try { await q(`UPDATE public.profiles SET is_super_admin = true WHERE user_id = $1`, [ids.user_a]); }
catch (e) { erro = e.message; }
check("T11f SQL Editor ainda pode definir super admin", !erro, erro || "");

// --- T12: PII de clientes cross-tenant --------------------------------------
await as("authenticated", ids.user_b, "donoB@x.com");
r = await q(`SELECT count(*)::int AS n FROM public.maleta_interesses`);
check("T12a org B não vê interesses da org A", r.rows[0].n === 1, `viu ${r.rows[0].n}`);
await as("anon");
r = await q(`SELECT count(*)::int AS n FROM public.maleta_interesses`);
check("T12b anon não vê interesse nenhum", r.rows[0].n === 0);
r = await q(`SELECT count(*)::int AS n FROM public.pedidos_catalogo`);
check("T12c anon não lê pedidos de catálogo", r.rows[0].n === 0);

// --- T13: policies permissivas antigas sumiram ------------------------------
await db.exec("RESET ROLE");
const permissivas = (await q(`
  SELECT tablename, policyname FROM pg_policies
   WHERE schemaname = 'public'
     AND policyname IN ('Users can read purchases by access_code','roles_insert_own_policy',
       'Authenticated can manage fidelidade','Authenticated can view historico_precos',
       'Authenticated can view maletas_pecas','Authenticated can view romaneios_pecas',
       'Anyone can view catalogos_pecas','Anyone can update pedidos_catalogo',
       'Users see pedidos from own catalogos','Allow romaneios_pecas insert',
       'maleta_interesses_select_public','maleta_interesses_select_portal',
       'Portal anon can view resellers or admin sees own resellers',
       'codigos_acesso_update_on_use','Users can insert own pecas','Users can view org pecas',
       'Users can update permissoes of their org funcionarios')`)).rows;
check("T13 todas as policies permissivas alvo foram derrubadas",
  permissivas.length === 0, permissivas.map((p) => `${p.tablename}.${p.policyname}`).join(", "));

// --- T14: estoque atômico ---------------------------------------------------
await as("authenticated", ids.user_a, "donoA@x.com");
r = await q(`SELECT public.ajustar_estoque_peca($1, -3) AS novo`, [pecaA]);
check("T14a baixa de estoque funciona (10-3=7)", r.rows[0].novo === 7, JSON.stringify(r.rows[0]));
r = await q(`SELECT public.ajustar_estoque_peca($1, -100) AS novo`, [pecaA]);
check("T14b estoque nunca fica negativo", r.rows[0].novo === 0, JSON.stringify(r.rows[0]));
r = await q(`SELECT public.ajustar_estoque_peca($1, 4) AS novo`, [pecaA]);
check("T14c devolução ao estoque funciona", r.rows[0].novo === 4);
erro = null;
try { await q(`SELECT public.ajustar_estoque_peca($1, -1)`, [pecaB]); }
catch (e) { erro = e.message; }
check("T14d não move estoque de outra organização", /permissão/i.test(erro || ""), erro || "moveu");

// --- T15: ativação de código de acesso --------------------------------------
await as("authenticated", ids.user_func, "outro@x.com");
r = await q(`SELECT public.ativar_codigo_acesso('ABCDEF123456') AS res`);
check("T15a código de outro e-mail é recusado", r.rows[0].res.erro === "email_divergente", JSON.stringify(r.rows[0].res));

await as("authenticated", ids.user_func, "comprador@x.com");
r = await q(`SELECT public.ativar_codigo_acesso('ABCDEF123456') AS res`);
check("T15b e-mail correto ativa o plano", r.rows[0].res.ok === true, JSON.stringify(r.rows[0].res));

await db.exec("RESET ROLE");
r = await q(`SELECT usado, usado_por FROM public.codigos_acesso WHERE codigo='ABCDEF123456'`);
check("T15c código marcado como usado pelo dono",
  r.rows[0].usado === true && r.rows[0].usado_por === ids.user_func);
r = await q(`SELECT status, plano FROM public.assinaturas WHERE user_id = $1`, [ids.user_func]);
check("T15d assinatura criada e ativa", r.rows[0]?.status === "ativo");

await as("authenticated", ids.user_func, "comprador@x.com");
r = await q(`SELECT public.ativar_codigo_acesso('ABCDEF123456') AS res`);
check("T15e reativação é idempotente", r.rows[0].res.ok === true && r.rows[0].res.reaproveitado === true,
  JSON.stringify(r.rows[0].res));

r = await q(`SELECT public.ativar_codigo_acesso('NAOEXISTE1234') AS res`);
check("T15f código inexistente é recusado", r.rows[0].res.erro === "codigo_invalido");

// anon não consome mais códigos
await as("anon");
r = await q(`UPDATE public.codigos_acesso SET usado = true WHERE codigo = 'ABCDEF123456' RETURNING id`);
check("T15g anon não queima códigos pagos", r.rows.length === 0);

// --- T16: get_pending_access_code fora do alcance ---------------------------
await db.exec("RESET ROLE");
r = await q(`SELECT has_function_privilege('anon','public.get_pending_access_code(text)','EXECUTE') AS pode`);
check("T16a anon não executa get_pending_access_code", r.rows[0].pode === false);
r = await q(`SELECT has_function_privilege('anon','public.verify_portal_password_by_id(uuid,text)','EXECUTE') AS pode`);
check("T16b anon não executa verify_portal_password_by_id", r.rows[0].pode === false);
r = await q(`SELECT has_function_privilege('anon','public.debitar_estoque_ecommerce(uuid,integer)','EXECUTE') AS pode`);
check("T16c anon não executa debitar_estoque_ecommerce", r.rows[0].pode === false);
r = await q(`SELECT has_function_privilege('anon','public.portal_login(text,text)','EXECUTE') AS pode`);
check("T16d anon ainda executa portal_login (login público)", r.rows[0].pode === true);

// --- T18: telas de equipe continuam funcionando ------------------------------
// (regressão: a checagem de "mesma organização" não pode depender de RLS de
//  memberships, senão o funcionário deixa de ver os colegas)
await as("authenticated", ids.user_func, "func@x.com");
r = await q(`SELECT nome FROM public.profiles ORDER BY nome`);
check("T18a funcionário vê os colegas da própria organização",
  r.rows.length === 2 && r.rows.some((x) => x.nome === "Dono A"),
  JSON.stringify(r.rows));
check("T18b e não vê ninguém da outra organização",
  !r.rows.some((x) => x.nome === "Dono B"), JSON.stringify(r.rows));

erro = null;
try {
  await q(`INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem)
           VALUES ($1,'aviso','Oi','Colega da mesma org')`, [ids.user_a]);
} catch (e) { erro = e.message; }
check("T18c notificação para colega da mesma org funciona", !erro, erro || "");

erro = null;
try {
  await q(`INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem)
           VALUES ($1,'aviso','Oi','Usuário de outro tenant')`, [ids.user_b]);
} catch (e) { erro = e.message; }
check("T18d notificação para outro tenant é bloqueada", !!erro, "inseriu sem erro");

// --- T19: Seção 9 não quebrou o app -----------------------------------------
await db.exec("RESET ROLE");
r = await q(`SELECT has_function_privilege('authenticated','public.maleta_registrar_venda(uuid,integer,numeric)','EXECUTE') AS pode`);
check("T19a usuário logado ainda executa maleta_registrar_venda", r.rows[0].pode === true);
r = await q(`SELECT has_function_privilege('anon','public.maleta_registrar_venda(uuid,integer,numeric)','EXECUTE') AS pode`);
check("T19b anon não executa maleta_registrar_venda", r.rows[0].pode === false);
r = await q(`SELECT has_function_privilege('authenticated','public.ajustar_estoque_peca(uuid,integer,boolean)','EXECUTE') AS pode`);
check("T19c usuário logado executa ajustar_estoque_peca", r.rows[0].pode === true);
r = await q(`SELECT has_function_privilege('anon','public.ajustar_estoque_peca(uuid,integer,boolean)','EXECUTE') AS pode`);
check("T19d anon não executa ajustar_estoque_peca", r.rows[0].pode === false);
r = await q(`SELECT has_function_privilege('anon','public.session_close(text)','EXECUTE') AS pode`);
check("T19e logout público continua acessível", r.rows[0].pode === true);

// --- T17: idempotência da migration -----------------------------------------
try {
  await db.exec(readMigration());
  check("T17 migration roda duas vezes sem erro", true);
} catch (e) {
  check("T17 migration roda duas vezes sem erro", false, e.message);
}

// =============================================================================
} catch (e) {
  fail++;
  results.push("  ERRO INESPERADO: " + e.message);
}

console.log(results.join("\n"));
console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
