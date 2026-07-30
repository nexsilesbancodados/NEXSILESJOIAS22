/**
 * Gera um schema sintético a partir de src/integrations/supabase/types.ts
 * (que é gerado pelo Supabase a partir do banco real, logo é a fonte fiel das
 * colunas atuais). O objetivo é ter um Postgres local onde a migration de
 * hardening possa ser EXECUTADA de verdade — pegando erros de nome de coluna,
 * assinatura de função, compilação de plpgsql e tipo em RETURNS TABLE.
 */
import fs from "node:fs";

const TYPES = "../../src/integrations/supabase/types.ts";
const src = fs.readFileSync(TYPES, "utf8").replace(/\r\n/g, "\n");

// --- extrai os blocos "Tables: { nome: { Row: { ... } } }" ---------------------
const tablesStart = src.indexOf("\n    Tables: {");
const viewsStart = src.indexOf("\n    Views: {");
const tablesBlock = src.slice(tablesStart, viewsStart > 0 ? viewsStart : undefined);

const tables = [];
const tableRe = /^      ([a-z0-9_]+): \{$/gm;
let m;
const marks = [];
while ((m = tableRe.exec(tablesBlock)) !== null) marks.push({ name: m[1], at: m.index });

for (let i = 0; i < marks.length; i++) {
  const chunk = tablesBlock.slice(marks[i].at, i + 1 < marks.length ? marks[i + 1].at : undefined);
  const rowStart = chunk.indexOf("Row: {");
  const insertStart = chunk.indexOf("Insert: {");
  if (rowStart < 0) continue;
  const rowBlock = chunk.slice(rowStart + 6, insertStart > 0 ? insertStart : undefined);
  const cols = [];
  for (const line of rowBlock.split("\n")) {
    const mm = /^\s*([a-z0-9_]+)\s*:\s*(.+?)$/.exec(line.trim() ? line : "");
    if (!mm) continue;
    const name = mm[1];
    let tsType = mm[2].replace(/[,;]\s*$/, "").trim();
    if (name === "Relationships" || tsType.startsWith("{") || tsType.startsWith("[")) continue;
    const nullable = /\|\s*null/.test(tsType);
    cols.push({ name, tsType: tsType.replace(/\s*\|\s*null/, "").trim(), nullable });
  }
  if (cols.length) tables.push({ name: marks[i].name, cols });
}

// --- mapeia TS -> tipo Postgres ----------------------------------------------
const INT_COLS = new Set([
  "quantidade", "quantidade_vendida", "quantidade_inicial", "quantidade_devolvida",
  "quantidade_perdida", "quantidade_minima", "estoque", "estoque_minimo", "pontos",
  "pontos_fidelidade", "pontos_utilizados", "nota", "rating", "ordem", "score",
  "limite_uso", "usos_atuais", "resend_count", "duracao_segundos", "numero_sequencial",
  "trial_dias", "parcelas", "lead_score", "dias", "prazo_devolucao", "max_tokens",
  "message_count", "numero_pedido", "numero", "tentativas", "attempts", "peso",
]);

// colunas uuid cujo nome não termina em _id
const UUID_COLS = new Set([
  "usado_por", "user_id_convertido", "assigned_to", "closed_by",
  "aprovado_por", "criado_por", "atualizado_por",
]);

const pgType = (table, { name, tsType }) => {
  if (tsType === "boolean") return "boolean";
  if (tsType === "Json") return "jsonb";
  if (tsType === "string[]") return "text[]";
  if (tsType === "number[]") return "numeric[]";
  if (tsType === "number") return INT_COLS.has(name) ? "integer" : "numeric";
  // strings
  if (name === "id" || name.endsWith("_id") || UUID_COLS.has(name)) {
    // ids textuais conhecidos (referências externas de gateways)
    if (/mercadopago|stripe|payment|preference|instancia|external/.test(name)) return "text";
    return "uuid";
  }
  if (name === "data_venda" || name === "data_devolucao" || name === "data_entrega"
      || name === "data_nascimento" || name === "data_previsao" || name === "data_envio"
      || name === "data_criacao") return "date";
  if (name.endsWith("_at") || name.startsWith("data_") || /_em$/.test(name)
      || name === "valido_ate" || name === "data_fim" || name === "data_inicio"
      || name === "data_validade") return "timestamptz";
  return "text";
};

let out = [];
out.push("-- Schema sintético gerado de types.ts (apenas para validar a migration).");
for (const t of tables) {
  const defs = t.cols.map((c) => {
    const type = pgType(t.name, c);
    let def = `  ${c.name} ${type}`;
    if (c.name === "id" && type === "uuid") {
      def += " PRIMARY KEY DEFAULT gen_random_uuid()";
    } else if (!c.nullable) {
      // Defaults para colunas NOT NULL: em produção elas têm default (o app não
      // as informa em todo INSERT). Sem isso o seed de teste ficaria irreal.
      const dflt =
        type === "timestamptz" ? " DEFAULT now()"
        : type === "date" ? " DEFAULT CURRENT_DATE"
        : type === "boolean" ? " DEFAULT false"
        : type === "integer" || type === "numeric" ? " DEFAULT 0"
        : type === "jsonb" ? " DEFAULT '{}'::jsonb"
        : type.endsWith("[]") ? " DEFAULT '{}'"
        : "";
      def += dflt + " NOT NULL";
    }
    return def;
  });
  out.push(`CREATE TABLE public.${t.name} (\n${defs.join(",\n")}\n);`);
}

// unique/constraints que a migration e os triggers assumem
out.push(`
-- constraints que o app/migrations assumem
ALTER TABLE public.assinaturas ADD CONSTRAINT assinaturas_user_id_key UNIQUE (user_id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_role_key UNIQUE (user_id, role);
ALTER TABLE public.codigos_acesso ADD CONSTRAINT codigos_acesso_codigo_key UNIQUE (codigo);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
`);

fs.writeFileSync("./schema-sintetico.sql", out.join("\n\n") + "\n");
console.log(`Tabelas geradas: ${tables.length}`);
console.log(`Colunas totais: ${tables.reduce((a, t) => a + t.cols.length, 0)}`);
