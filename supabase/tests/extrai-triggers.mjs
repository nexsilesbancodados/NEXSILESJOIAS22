/**
 * Extrai das migrations a ÚLTIMA definição das funções e triggers que rodam no
 * cadastro, para o teste usar exatamente o que está em produção (sem eu
 * transcrever nada à mão).
 */
import fs from "node:fs";
import path from "node:path";

const MIG = "../migrations";
const files = fs.readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort();

const ALVOS = [
  "handle_new_user",
  "handle_new_user_organization",
  "ativar_codigo_no_signup",
  "crm_capturar_lead_signup",
  "provisionar_ecommerce_config",
  "gerar_slug_loja",
];

const ultima = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(MIG, f), "utf8").replace(/\r\n/g, "\n");
  const re = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-z0-9_]+)\s*\([\s\S]*?\$\$[\s\S]*?\$\$\s*;/gi;
  for (const m of src.matchAll(re)) {
    const nome = m[1].toLowerCase();
    if (ALVOS.includes(nome)) ultima.set(nome, m[0]);
  }
}

const faltando = ALVOS.filter((a) => !ultima.has(a));
const out = [
  "-- Funções de cadastro extraídas das migrations (última definição de cada).",
  ...ALVOS.filter((a) => ultima.has(a)).map((a) => `\n-- ${a}\n${ultima.get(a)}`),
  `
-- triggers, como estão em produção
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_organization ON auth.users;
CREATE TRIGGER on_auth_user_created_organization AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_organization();

DROP TRIGGER IF EXISTS on_auth_user_created_activate_code ON auth.users;
CREATE TRIGGER on_auth_user_created_activate_code AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ativar_codigo_no_signup();

DROP TRIGGER IF EXISTS crm_lead_on_signup ON auth.users;
CREATE TRIGGER crm_lead_on_signup AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.crm_capturar_lead_signup();
`,
];

fs.writeFileSync("./triggers-signup.sql", out.join("\n"));
console.log("extraídas:", ALVOS.filter((a) => ultima.has(a)).join(", "));
if (faltando.length) console.log("NÃO encontradas (serão stubadas):", faltando.join(", "));
