import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const db = await PGlite.create();
await db.exec(read("./base.sql"));
await db.exec(read("./schema-sintetico.sql"));
await db.exec(read("./preexistente.sql"));

await db.query(`INSERT INTO public.codigos_acesso (codigo,email,plano,valor_pago,valido_ate,usado,periodo) VALUES
  ('AAAA11112222','um@x.com','nexsiles',129, now()+interval '20 days', false,'mensal'),
  ('BBBB33334444','dois@x.com','nexsiles',1290, now()+interval '300 days', false,'anual'),
  ('CCCC55556666','tres@x.com','nexsiles',129, now()+interval '5 days', true,'mensal'),
  ('DDDD77778888','quatro@x.com','nexsiles',129, now()-interval '1 day', false,'mensal')`);

const sql = read("../../docs/ROTACAO-codigos-de-acesso.sql");
let pass=0, fail=0;
const t=(n,ok,d="")=>{ if(ok){pass++;console.log("OK    "+n);} else {fail++;console.log("FALHA "+n+(d?" — "+d:""));} };
try {
  const res = await db.exec(sql);
  const lista = res.filter(r => r.rows.length && r.rows[0].email !== undefined).pop();
  t("roda sem erro e devolve a lista", !!lista && lista.rows.length === 2, `linhas: ${lista?.rows.length}`);
  const emails = (lista?.rows ?? []).map(r => r.email).sort();
  t("só rotaciona os não usados e ainda válidos", JSON.stringify(emails) === '["dois@x.com","um@x.com"]', JSON.stringify(emails));
  t("gera código novo de 12 caracteres", (lista?.rows ?? []).every(r => (r["código novo"]||"").length === 12));
  t("código novo é diferente do antigo", (lista?.rows ?? []).every(r => r["código novo"] !== r["código antigo (não vale mais)"]));
} catch (e) { t("roda sem erro", false, e.message); }

let r = await db.query(`SELECT count(*)::int n FROM public.codigos_acesso WHERE usado=false AND valido_ate > now()`);
t("sobram exatamente 2 códigos válidos (os novos)", r.rows[0].n === 2, `n=${r.rows[0].n}`);
r = await db.query(`SELECT count(*)::int n FROM public.codigos_acesso WHERE codigo IN ('AAAA11112222','BBBB33334444') AND valido_ate > now()`);
t("os antigos expostos deixaram de valer", r.rows[0].n === 0, `n=${r.rows[0].n}`);
r = await db.query(`SELECT usado FROM public.codigos_acesso WHERE codigo='CCCC55556666'`);
t("código já usado não foi mexido", r.rows[0].usado === true);
r = await db.query(`SELECT count(*)::int n FROM public.codigos_acesso WHERE email='dois@x.com' AND periodo='anual' AND usado=false AND valido_ate > now()`);
t("plano e período preservados no código novo", r.rows[0].n === 1);
console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail?1:0);
