import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { parseJson, z } from "../_shared/validate.ts";

const CheckoutBodySchema = z.object({
  email: z.string().email().max(255),
  plano: z.enum(["ecommerce", "bronze", "prata", "diamante", "teste"]),
  periodo: z.enum(["mensal", "anual"]),
});

interface CheckoutRequest {
  email: string;
  plano: "ecommerce" | "bronze" | "prata" | "diamante" | "teste";
  periodo: "mensal" | "anual";
}

// Plano único Nexsiles Prime — R$ 129/mês. Todos os aliases apontam para o mesmo.
const PLANOS: Record<string, { nome: string; valor_mensal: number; valor_anual: number }> = {
  ecommerce: { nome: "Nexsiles Prime", valor_mensal: 129.0, valor_anual: 1290.0 },
  bronze: { nome: "Nexsiles Prime", valor_mensal: 129.0, valor_anual: 1290.0 },
  prata: { nome: "Nexsiles Prime", valor_mensal: 129.0, valor_anual: 1290.0 },
  diamante: { nome: "Nexsiles Prime", valor_mensal: 129.0, valor_anual: 1290.0 },
  teste: { nome: "Teste", valor_mensal: 1.0, valor_anual: 1.0 },
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 20 checkout starts per IP per minute (anti-abuse / anti-spam)
  const rl = await rateLimit(req, "mercadopago-checkout-public", { maxRequests: 20 });
  if (rl) return rl;

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const parsed = await parseJson(req, CheckoutBodySchema);
    if (parsed.error) return parsed.error;
    const { email, plano, periodo } = parsed.data;

    if (!PLANOS[plano]) {
      throw new Error("Plano inválido");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Email inválido");
    }

    const planoInfo = PLANOS[plano];
    const valor = periodo === "anual" ? planoInfo.valor_anual : planoInfo.valor_mensal;
    const descricao = `${planoInfo.nome} - ${periodo === "anual" ? "Anual" : "Mensal"}`;
    
    const origin = req.headers.get("origin") || "https://nexsiles.com.br";

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
        email: email,
      },
      back_urls: {
        success: `${origin}/landing?pagamento=sucesso&email=${encodeURIComponent(email)}`,
        failure: `${origin}/landing?pagamento=erro`,
        pending: `${origin}/landing?pagamento=pendente`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        plano: plano,
        periodo: periodo,
        valor: valor,
        email: email,
      }),
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook?source_news=webhooks`,
      statement_descriptor: "NEXSILES",
    };

    console.log("Creating public Mercado Pago preference:", preferenceData);

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
    console.error("Error in mercadopago-checkout-public:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
