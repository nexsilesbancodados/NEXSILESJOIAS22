// =============================================================================
// Edge Function: consultar-codigo-pendente
// =============================================================================
// Versão autocontida (sem imports de ../_shared), para colar direto no editor
// de Edge Functions do painel do Supabase.
//
// Para que serve: depois do pagamento, a tela de retorno consulta o código de
// acesso do e-mail da compradora. Substitui a RPC get_pending_access_code, que
// estava liberada para qualquer visitante e permitia varrer e-mails para
// descobrir quem comprou um plano e capturar o código antes do comprador.
//
// Aqui a mesma consulta passa por limite de 5 tentativas por minuto por IP.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ipDoCliente = (req: Request): string =>
  req.headers.get("cf-connecting-ip") ||
  req.headers.get("x-real-ip") ||
  (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
  "desconhecido";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // limite: 5 consultas por minuto por IP
    const { data: permitido } = await supabase.rpc("check_rate_limit", {
      p_identifier: ipDoCliente(req),
      p_endpoint: "consultar-codigo-pendente",
      p_max_requests: 5,
      p_window_seconds: 60,
    });
    if (permitido === false) {
      return json({ error: "Muitas consultas. Aguarde um minuto." }, 429);
    }

    let corpo: { email?: string };
    try {
      corpo = await req.json();
    } catch {
      return json({ error: "Corpo inválido" }, 400);
    }

    const email = String(corpo?.email ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return json({ error: "E-mail inválido" }, 400);
    }

    const { data, error } = await supabase
      .from("codigos_acesso")
      .select("codigo, plano, periodo")
      .eq("usado", false)
      .gt("valido_ate", new Date().toISOString())
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[consultar-codigo-pendente] erro", error);
      return json({ error: "Erro ao consultar" }, 500);
    }

    if (!data) return json({ pendente: false });

    return json({
      pendente: true,
      codigo: data.codigo,
      plano: data.plano,
      periodo: data.periodo,
    });
  } catch (error) {
    console.error("[consultar-codigo-pendente] erro", error);
    return json({ error: "Erro interno" }, 500);
  }
});
