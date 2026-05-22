// LGPD: Export user data
// Retorna JSON com todos os dados do usuário + organização para download

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("export-user-data");

const EXPORTABLE_TABLES = [
  "profiles", "memberships", "organizations",
  "pecas", "clientes", "vendas", "venda_itens",
  "maletas", "maletas_pecas", "revendedoras",
  "catalogos", "pedidos_catalogo", "pedidos_catalogo_itens",
  "romaneios", "romaneios_pecas",
  "banhos", "fornecedores", "campanhas",
  "ecommerce_pedidos", "ecommerce_pedido_itens", "ecommerce_config",
  "fiado_movimentacoes", "fidelidade_pontos",
  "metas", "configuracoes", "notificacoes",
] as const;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await anon.auth.getUser();
    if (uErr || !user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: membership } = await service.from("memberships").select("organization_id").eq("user_id", user.id).maybeSingle();
    const orgId = membership?.organization_id;

    const exported: Record<string, unknown> = {
      _meta: { user_id: user.id, organization_id: orgId, exported_at: new Date().toISOString() },
      auth_user: { id: user.id, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at },
    };

    for (const table of EXPORTABLE_TABLES) {
      try {
        let q = service.from(table).select("*");
        if (orgId && !["profiles", "memberships"].includes(table)) q = q.eq("organization_id", orgId);
        if (["profiles", "memberships"].includes(table)) q = q.eq("user_id", user.id);
        if (table === "organizations" && orgId) q = service.from(table).select("*").eq("id", orgId);
        const { data, error } = await q;
        if (error) { log.warn("Table export failed", { table, error: error.message }); exported[table] = { error: error.message }; }
        else exported[table] = data;
      } catch (e: any) { exported[table] = { error: e.message }; }
    }

    log.info("Data exported", { user_id: user.id, tables: EXPORTABLE_TABLES.length });

    return new Response(JSON.stringify(exported, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="nexsiles-export-${user.id.slice(0, 8)}-${Date.now()}.json"`,
      },
    });
  } catch (err: any) {
    log.error("Export error", { error: err.message });
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
