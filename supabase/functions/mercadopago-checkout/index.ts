import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckoutRequest {
  plano: "nexsiles" | "nexsiles_max";
  periodo: "mensal" | "anual";
}

const PLANOS = {
  nexsiles: {
    nome: "Nexsiles",
    descricao: "Gestão completa para joalherias e semijoias",
    valor_mensal: 189.0,
    valor_anual: 1890.0,
  },
  nexsiles_max: {
    nome: "Nexsiles Max",
    descricao: "Gestão avançada com IA e e-commerce integrado",
    valor_mensal: 249.0,
    valor_anual: 2490.0,
  },
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Usuário não autenticado");

    const { plano, periodo }: CheckoutRequest = await req.json();
    if (!plano || !PLANOS[plano]) throw new Error("Plano inválido");

    const planoInfo = PLANOS[plano];
    const valor = periodo === "anual" ? planoInfo.valor_anual : planoInfo.valor_mensal;
    const descricao = `${planoInfo.nome} - ${periodo === "anual" ? "Anual" : "Mensal"}`;
    const externalRef = `assinatura_${user.id}_${plano}_${periodo}_${Date.now()}`;

    const origin = req.headers.get("origin") || "https://nexsiles.com.br";

    // Split user email name for payer info
    const emailName = user.email?.split("@")[0] || "Cliente";

    const preferenceData = {
      // ===== ITEMS (completo) =====
      items: [
        {
          id: `plano_${plano}_${periodo}`,
          title: descricao,
          description: planoInfo.descricao,
          category_id: "services",
          quantity: 1,
          currency_id: "BRL",
          unit_price: valor,
        },
      ],

      // ===== PAYER (email obrigatório + nome) =====
      payer: {
        email: user.email,
        first_name: emailName,
      },

      // ===== BACK URLS =====
      back_urls: {
        success: `${origin}/planos?success=true&ref=${externalRef}`,
        failure: `${origin}/planos?canceled=true`,
        pending: `${origin}/planos?success=true&ref=${externalRef}`,
      },
      auto_return: "approved",

      // ===== EXTERNAL REFERENCE (obrigatório - conciliação) =====
      external_reference: externalRef,

      // ===== NOTIFICATION URL (obrigatório - webhook) =====
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,

      // ===== STATEMENT DESCRIPTOR =====
      statement_descriptor: "NEXSILES",

      // ===== BINARY MODE (desativado para suportar PIX/boleto que são pendentes) =====
      binary_mode: false,

      // ===== METADATA =====
      metadata: {
        plano,
        periodo,
        valor,
        user_id: user.id,
        email: user.email,
      },
    };

    console.log("Creating subscription preference:", JSON.stringify(preferenceData, null, 2));

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error("Mercado Pago error:", errorData);
      throw new Error(`Erro ao criar preferência: ${errorData}`);
    }

    const preference = await mpResponse.json();
    console.log("Subscription preference created:", preference.id);

    return new Response(
      JSON.stringify({
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in mercadopago-checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
