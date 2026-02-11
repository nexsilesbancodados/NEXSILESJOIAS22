import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { access_code } = await req.json();

    if (!access_code) {
      return new Response(
        JSON.stringify({ valid: false, error: "Missing access_code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const codigoClean = String(access_code).replace(/[^A-Z0-9]/gi, "").toUpperCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("codigos_acesso")
      .select("*")
      .eq("codigo", codigoClean)
      .maybeSingle();

    if (error || !data) {
      return new Response(
        JSON.stringify({ valid: false, error: "Código inválido" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already used
    if (data.usado) {
      return new Response(
        JSON.stringify({ valid: false, error: "Código já utilizado", used: true }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    const now = new Date();
    const validoAte = new Date(data.valido_ate);
    if (now > validoAte) {
      return new Response(
        JSON.stringify({
          valid: false,
          expired: true,
          error: "Assinatura expirada",
          user: { email: data.email, plano: data.plano, expires_at: data.valido_ate },
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Valid code
    return new Response(
      JSON.stringify({
        valid: true,
        user: {
          email: data.email,
          plano: data.plano,
          expires_at: data.valido_ate,
          valor_pago: data.valor_pago,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ valid: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
