/**
 * Varredura de regressão: cruza TODAS as operações que o app faz em tabelas
 * (from('x').select/insert/update/delete/upsert) com o conjunto FINAL de
 * policies RLS, depois da migration de hardening.
 *
 * Objetivo: garantir que o endurecimento não deixou nenhuma tela sem caminho de
 * acesso (o risco oposto ao vazamento).
 */
import fs from "node:fs";
import path from "node:path";

const SRC = "../../src";
const MIG = "../migrations";

// ---------------------------------------------------- policies finais (replay)
const files = fs.readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort();
const policies = new Map();
const createRe = /CREATE\s+POLICY\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"([^"]+)"|([A-Za-z0-9_]+))\s+ON\s+(?:public\.)?"?([A-Za-z0-9_]+)"?([\s\S]*?);/gi;
const dropRe = /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(?:"([^"]+)"|([A-Za-z0-9_]+))\s+ON\s+(?:public\.)?"?([A-Za-z0-9_]+)"?/gi;
for (const f of files) {
  const src = fs.readFileSync(path.join(MIG, f), "utf8").replace(/\r\n/g, "\n");
  for (const m of src.matchAll(dropRe)) policies.delete(m[3].toLowerCase() + "||" + (m[1] ?? m[2]));
  for (const m of src.matchAll(createRe)) {
    const t = m[3].toLowerCase(), name = m[1] ?? m[2];
    const body = m[4].replace(/\s+/g, " ").trim();
    const cmdM = /FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)/i.exec(body);
    const toM = /\bTO\s+([a-z_, ]+?)(?:\s+USING|\s+WITH|$)/i.exec(body);
    policies.set(t + "||" + name, {
      table: t, name, body,
      cmd: (cmdM ? cmdM[1] : "ALL").toUpperCase(),
      roles: toM ? toM[1].split(",").map((s) => s.trim()) : ["public"],
      denyAll: /USING\s*\(\s*false\s*\)/i.test(body),
    });
  }
}

const cobre = (table, op) => {
  const rel = [...policies.values()].filter((p) => p.table === table);
  return rel.filter((p) => {
    if (p.cmd !== "ALL" && p.cmd !== op) return false;
    if (p.denyAll) return false;
    // vale para usuário logado?
    return p.roles.includes("authenticated") || p.roles.includes("public");
  });
};

// ------------------------------------------------------- operações do app
const arquivos = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name) && !p.includes("types.ts")) arquivos.push(p);
  }
})(SRC);

const usos = new Map(); // "tabela||OP" -> Set(arquivos)
const fromRe = /\.from\(\s*['"`]([a-z0-9_]+)['"`]/g;
for (const f of arquivos) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(fromRe)) {
    const tabela = m[1];
    const janela = src.slice(m.index, m.index + 400);
    const ops = [];
    if (/\.select\(/.test(janela)) ops.push("SELECT");
    if (/\.insert\(/.test(janela)) ops.push("INSERT");
    if (/\.update\(/.test(janela)) ops.push("UPDATE");
    if (/\.delete\(/.test(janela)) ops.push("DELETE");
    if (/\.upsert\(/.test(janela)) ops.push("INSERT", "UPDATE");
    for (const op of (ops.length ? ops : ["SELECT"])) {
      const k = tabela + "||" + op;
      if (!usos.has(k)) usos.set(k, new Set());
      usos.get(k).add(path.relative(SRC, f).replace(/\\/g, "/"));
    }
  }
}

// views públicas e tabelas que o app acessa só por RPC não precisam de policy
const VIEWS = new Set([
  "maletas_public", "catalogos_public", "ecommerce_config_public", "pecas_loja_public",
  "agente_ia_config_public",
]);

const problemas = [];
const ok = [];
for (const [k, arqs] of [...usos.entries()].sort()) {
  const [tabela, op] = k.split("||");
  if (VIEWS.has(tabela)) continue;
  const temTabela = [...policies.values()].some((p) => p.table === tabela);
  const cobertas = cobre(tabela, op);
  if (!temTabela) {
    problemas.push({ tabela, op, motivo: "tabela sem nenhuma policy no histórico", arqs: [...arqs] });
  } else if (cobertas.length === 0) {
    problemas.push({ tabela, op, motivo: "nenhuma policy cobre esta operação para usuário logado", arqs: [...arqs] });
  } else {
    ok.push(`${tabela}.${op} → ${cobertas.map((p) => p.name).join(", ")}`);
  }
}

console.log(`Operações do app mapeadas: ${usos.size}`);
console.log(`Com policy compatível: ${ok.length}`);
console.log(`\n=== SEM CAMINHO DE ACESSO (possível regressão) : ${problemas.length} ===`);
for (const p of problemas) {
  console.log(`\n[${p.op}] ${p.tabela} — ${p.motivo}`);
  console.log(`   usado em: ${p.arqs.slice(0, 4).join(", ")}${p.arqs.length > 4 ? ` (+${p.arqs.length - 4})` : ""}`);
}
