// LGPD: Request account deletion
// Cria registro em account_deletion_requests com 30 dias de carência.
// Após esse período, o cron `process-account-deletions` apaga a conta e dados.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import { parseJson, z } from "../_shared/validate.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("request-account-deletion");

const BodySchema = z.object({
  reason: z.string().max(1000).optional(),
  confirm: z.literal(true),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const parsed = await parseJson(req, BodySchema);
    if (parsed.error) return parsed.error;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await anon.auth.getUser();
    if (uErr || !user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: membership } = await service.from("memberships").select("organization_id").eq("user_id", user.id).maybeSingle();

    // Cancel any previous pending request
    await service.from("account_deletion_requests").update({ status: "cancelled" }).eq("user_id", user.id).eq("status", "pending");

    const { data, error } = await service.from("account_deletion_requests").insert({
      user_id: user.id,
      organization_id: membership?.organization_id ?? null,
      email: user.email!,
      reason: parsed.data.reason ?? null,
      status: "pending",
    }).select().single();

    if (error) throw error;

    log.info("Deletion requested", { user_id: user.id, scheduled_for: data.scheduled_for });

    return new Response(JSON.stringify({
      ok: true,
      scheduled_for: data.scheduled_for,
      message: "Sua conta será excluída em 30 dias. Você pode cancelar a qualquer momento antes disso.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    log.error("Request deletion error", { error: err.message });
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
