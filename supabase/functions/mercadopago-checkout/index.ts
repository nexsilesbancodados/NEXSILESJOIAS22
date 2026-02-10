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

// Chaves públicas do Mercado Pago
const MERCADOPAGO_PUBLIC_KEY = "APP_USR-080297dc-b2f8-4e1b-9a31-d445004700dc";
const MERCADOPAGO_CLIENT_ID = "6130575203030867";

const PLANOS = {
  nexsiles: {
    nome: "Nexsiles",
    valor_mensal: 189.0,
    valor_anual: 1890.0, // 10 meses (2 meses grátis)
  },
  nexsiles_max: {
    nome: "Nexsiles Max",
    valor_mensal: 249.0,
    valor_anual: 2490.0, // 10 meses (2 meses grátis)
  },
};

serve(async (req: Request) => {
  // Handle CORS preflight
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
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { plano, periodo }: CheckoutRequest = await req.json();

    if (!plano || !PLANOS[plano]) {
      throw new Error("Plano inválido");
    }

    const planoInfo = PLANOS[plano];
    const valor = periodo === "anual" ? planoInfo.valor_anual : planoInfo.valor_mensal;
    const descricao = `${planoInfo.nome} - ${periodo === "anual" ? "Anual" : "Mensal"}`;
    
    const origin = req.headers.get("origin") || "https://nexsiles2567.lovable.app";

    // Create Mercado Pago preference
    const preferenceData = {
      items: [
        {
          title: descricao,
          description: `Assinatura ${planoInfo.nome}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: valor,
        },
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${origin}/landing?pagamento=sucesso`,
        failure: `${origin}/landing?pagamento=erro`,
        pending: `${origin}/landing?pagamento=pendente`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        plano: plano,
        periodo: periodo,
        valor: valor,
        email: user.email,
      }),
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "NEXSILES",
    };

    console.log("Creating Mercado Pago preference:", preferenceData);

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
    console.log("Preference created:", preference.id);

    return new Response(
      JSON.stringify({
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in mercadopago-checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
