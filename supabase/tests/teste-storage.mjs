/**
 * Testa a migration dos arquivos: dono altera/apaga, estranho não; upload e
 * leitura pública continuam funcionando.
 *
 * Monta um `storage.objects` equivalente ao do Supabase (com a coluna `owner` e
 * a função storage.foldername) porque o PGlite não traz o Storage.
 */
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const db = await PGlite.create();
await db.exec(read("./base.sql"));
await db.exec(read("./schema-sintetico.sql"));
await db.exec(read("./preexistente.sql"));
await db.exec(read("../migrations/20260730120000_hardening_sessoes_publicas_rls_privilegios.sql")
  .replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/g, "-- stub"));

// --- storage do Supabase (equivalente) --------------------------------------
await db.exec(`
  CREATE SCHEMA storage;
  CREATE TABLE storage.objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE FUNCTION storage.foldername(name text) RETURNS text[]
  LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array(name, '/') $$;
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  GRANT USAGE ON SCHEMA storage TO anon, authenticated;
  GRANT ALL ON TABLE storage.objects TO anon, authenticated;

  -- estado de hoje: qualquer logado altera e apaga qualquer arquivo
  CREATE POLICY "pecas_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'pecas');
  CREATE POLICY "pecas_insert_authenticated" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'pecas' AND auth.role() = 'authenticated');
  CREATE POLICY "pecas_update_authenticated" ON storage.objects
    FOR UPDATE USING (bucket_id = 'pecas' AND auth.role() = 'authenticated');
  CREATE POLICY "pecas_delete_authenticated" ON storage.objects
    FOR DELETE USING (bucket_id = 'pecas' AND auth.role() = 'authenticated');
  CREATE POLICY "fotos_vendas_auth_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'maleta-vendas-fotos');
  CREATE POLICY "fotos_vendas_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'maleta-vendas-fotos');
  CREATE POLICY "fotos_vendas_auth_upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'maleta-vendas-fotos');
`);

// --- duas lojas -------------------------------------------------------------
const ids = (await db.query(`
  WITH a AS (INSERT INTO public.organizations (name) VALUES ('Loja A') RETURNING id),
       b AS (INSERT INTO public.organizations (name) VALUES ('Loja B') RETURNING id),
       ua AS (INSERT INTO auth.users (email) VALUES ('a@x.com') RETURNING id),
       ub AS (INSERT INTO auth.users (email) VALUES ('b@x.com') RETURNING id)
  SELECT (SELECT id FROM a) org_a, (SELECT id FROM b) org_b,
         (SELECT id FROM ua) user_a, (SELECT id FROM ub) user_b`)).rows[0];
await db.query(`INSERT INTO public.memberships (user_id, organization_id, role)
                VALUES ($1,$2,'owner'), ($3,$4,'owner')`,
  [ids.user_a, ids.org_a, ids.user_b, ids.org_b]);

const arq = (await db.query(
  `INSERT INTO storage.objects (bucket_id, name, owner) VALUES
     ('pecas', 'pecas/1234-foto.jpg', $1),
     ('maleta-vendas-fotos', $2 || '/maleta1/venda.jpg', $1)
   RETURNING id, bucket_id`, [ids.user_a, ids.org_a])).rows;
const fotoPeca = arq[0].id, fotoVenda = arq[1].id;

let pass = 0, fail = 0;
const t = (n, ok, d = "") => { if (ok) { pass++; console.log(`OK    ${n}`); } else { fail++; console.log(`FALHA ${n}${d ? " — " + d : ""}`); } };
const como = async (uid) => {
  await db.exec("RESET ROLE");
  await db.query(`select set_config('test.uid',$1,false)`, [uid ?? ""]);
  await db.query(`select set_config('test.role','authenticated',false)`);
  await db.exec("SET ROLE authenticated");
};
const apagou = async (id) => (await db.query(`DELETE FROM storage.objects WHERE id = $1 RETURNING id`, [id])).rows.length > 0;

// --- ANTES da migration -----------------------------------------------------
console.log("--- estado de hoje (antes da correção) ---");
await como(ids.user_b);
const r0 = await db.query(`SELECT count(*)::int n FROM storage.objects WHERE id = $1`, [fotoPeca]);
t("loja B enxerga o arquivo da loja A (leitura pública, esperado)", r0.rows[0].n === 1);
await db.exec("RESET ROLE");
const podiaApagar = (await db.query(`
  SELECT count(*)::int n FROM pg_policies
   WHERE schemaname='storage' AND cmd='DELETE' AND qual ILIKE '%authenticated%'`)).rows[0].n;
t("existem regras de apagar que só pedem 'estar logado'", podiaApagar > 0, `n=${podiaApagar}`);

// --- aplica a migration -----------------------------------------------------
await db.exec(read("../migrations/20260730210000_storage_dono_do_arquivo.sql"));
console.log("\n--- depois da correção ---");

// estranho não mexe
await como(ids.user_b);
t("loja B NÃO apaga a foto da loja A", !(await apagou(fotoPeca)));
let up = await db.query(`UPDATE storage.objects SET name = 'hackeado.jpg' WHERE id = $1 RETURNING id`, [fotoPeca]);
t("loja B NÃO sobrescreve a foto da loja A", up.rows.length === 0);
t("loja B NÃO apaga a foto de venda da loja A", !(await apagou(fotoVenda)));

// dono mexe
await como(ids.user_a);
up = await db.query(`UPDATE storage.objects SET name = 'pecas/1234-foto-v2.jpg' WHERE id = $1 RETURNING id`, [fotoPeca]);
t("quem enviou consegue alterar o próprio arquivo", up.rows.length === 1);
t("quem enviou consegue apagar o próprio arquivo", await apagou(fotoPeca));

// arquivo com caminho da organização: outro usuário da MESMA loja consegue
await db.exec("RESET ROLE");
const userA2 = (await db.query(`INSERT INTO auth.users (email) VALUES ('a2@x.com') RETURNING id`)).rows[0].id;
await db.query(`INSERT INTO public.memberships (user_id, organization_id, role) VALUES ($1,$2,'member')`,
  [userA2, ids.org_a]);
await como(userA2);
t("colega da mesma loja apaga arquivo com o caminho da organização", await apagou(fotoVenda));

// upload e leitura continuam
await como(ids.user_b);
let ins = await db.query(`INSERT INTO storage.objects (bucket_id, name, owner)
                          VALUES ('pecas','pecas/nova.jpg',$1) RETURNING id`, [ids.user_b]);
t("upload continua funcionando", ins.rows.length === 1);
await db.exec("RESET ROLE");
await db.query(`select set_config('test.uid','',false)`);
await db.exec("SET ROLE anon");
const rAnon = await db.query(`SELECT count(*)::int n FROM storage.objects WHERE bucket_id='pecas'`);
t("visitante continua vendo as imagens da vitrine", rAnon.rows[0].n >= 1, `n=${rAnon.rows[0].n}`);

await db.exec("RESET ROLE");
try { await db.exec(read("../migrations/20260730210000_storage_dono_do_arquivo.sql")); pass++; console.log("OK    roda duas vezes sem erro"); }
catch (e) { fail++; console.log("FALHA idempotência — " + e.message); }

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
