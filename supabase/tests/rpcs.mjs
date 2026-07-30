/**
 * Confere que TODA RPC chamada pelo app existe no banco depois da migration e
 * está executável por quem chama (anon nas telas públicas, authenticated no app).
 * Pega erro de digitação em nome de função e REVOKE exagerado.
 */
import fs from "node:fs";
import path from "node:path";

const SRC = "../../src";
const FUNCS = "../functions";
const MIG = "../migrations";

// --- funções existentes ao final do histórico de migrations -------------------
const files = fs.readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort();
const existentes = new Map(); // nome -> { assinaturas:Set }
const dropRe = /DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-z0-9_]+)\s*\(([^)]*)\)/gi;
const createRe = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-z0-9_]+)\s*\(([\s\S]{0,600}?)\)\s*RETURNS/gi;
for (const f of files) {
  const src = fs.readFileSync(path.join(MIG, f), "utf8").replace(/\r\n/g, "\n");
  for (const m of src.matchAll(createRe)) {
    const nome = m[1].toLowerCase();
    if (!existentes.has(nome)) existentes.set(nome, new Set());
    existentes.get(nome).add(m[2].replace(/\s+/g, " ").trim());
  }
  for (const m of src.matchAll(dropRe)) {
    const nome = m[1].toLowerCase();
    const args = m[2].replace(/\s+/g, " ").trim().toLowerCase();
    if (existentes.has(nome)) {
      // remove a assinatura equivalente (comparando só os tipos)
      for (const a of [...existentes.get(nome)]) {
        const tipos = a.toLowerCase().replace(/\bp_[a-z0-9_]+\s+/g, "").replace(/\s*default[^,]*/g, "");
        if (tipos.replace(/\s/g, "") === args.replace(/\s/g, "")) existentes.get(nome).delete(a);
      }
      if (existentes.get(nome).size === 0) existentes.delete(nome);
    }
  }
}

// --- RPCs chamadas no frontend e nas edge functions --------------------------
const chamadas = new Map(); // nome -> Set(arquivo)
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !p.includes("types.ts")) out.push(p);
  }
  return out;
};
const rpcRe = /(?:dbRpc|\.rpc)\(\s*['"`]([a-z0-9_]+)['"`]/g;
for (const f of [...walk(SRC), ...walk(FUNCS)]) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(rpcRe)) {
    const n = m[1];
    if (!chamadas.has(n)) chamadas.set(n, new Set());
    chamadas.get(n).add(path.relative("..", f).replace(/\\/g, "/"));
  }
}

const IGNORAR = new Set(["function_name"]); // exemplo em comentário

const faltando = [];
for (const [nome, arqs] of [...chamadas.entries()].sort()) {
  if (IGNORAR.has(nome)) continue;
  if (!existentes.has(nome)) faltando.push({ nome, arqs: [...arqs] });
}

console.log(`RPCs chamadas pelo app/edge functions: ${chamadas.size}`);
console.log(`Presentes no banco após a migration: ${chamadas.size - faltando.length}`);
console.log(`\n=== CHAMADAS SEM FUNÇÃO CORRESPONDENTE: ${faltando.length} ===`);
for (const f of faltando) console.log(`  ${f.nome} — ${f.arqs.join(", ")}`);

// --- RPCs que a migration tirou do alcance do cliente ------------------------
const soServidor = [
  "check_rate_limit", "debitar_estoque_ecommerce", "gerar_codigo_acesso",
  "cleanup_rate_limits", "cleanup_webhook_queue", "cleanup_edge_function_errors",
  "hash_portal_password", "provisionar_ecommerce_config", "criar_dados_exemplo",
  "get_pending_access_code", "verify_portal_password_by_id", "verify_cliente_login",
  "verify_cliente_password",
];
const chamadasFrontend = new Map();
for (const f of walk(SRC)) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(rpcRe)) {
    if (!chamadasFrontend.has(m[1])) chamadasFrontend.set(m[1], new Set());
    chamadasFrontend.get(m[1]).add(path.relative(SRC, f).replace(/\\/g, "/"));
  }
}
const conflitos = soServidor.filter((n) => chamadasFrontend.has(n));
console.log(`\n=== FRONTEND CHAMANDO FUNÇÃO AGORA RESTRITA AO SERVIDOR: ${conflitos.length} ===`);
for (const n of conflitos) console.log(`  ${n} — ${[...chamadasFrontend.get(n)].join(", ")}`);
