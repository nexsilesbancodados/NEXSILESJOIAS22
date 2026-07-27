import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { parseJson, z } from "../_shared/validate.ts";

// Checkout público alinhado à documentação oficial do Mercado Pago (Checkout Pro).
// Referências:
//   https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integrate-checkout-pro
//   https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post
//   https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/idempotency-key

const CheckoutBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  plano: z.enum(["ecommerce", "bronze", "prata", "diamante", "nexsiles", "teste"]).default("nexsiles"),
  periodo: z.enum(["mensal", "anual"]).default("mensal"),
});

// Plano único Nexsiles Prime — R$ 129/mês. Aliases legados apontam para o mesmo produto.
const PLANOS: Record<string, { nome: string; valor_mensal: number; valor_anual: number }> = {
  nexsiles:  { nome: "Nexsiles Prime", valor_mensal: 129.0, valor_anual: 1290.0 },
  ecommerce: { nome: "Nexsiles Prime", valor_mensal: 129.0, valor_anual: 1290.0 },
  bronze:    { nome: "Nexsiles Prime", valor_mensal: 129.0, valor_anual: 1290.0 },
  prata:     { nome: "Nexsiles Prime", valor_mensal: 129.0, valor_anual: 1290.0 },
  diamante:  { nome: "Nexsiles Prime", valor_mensal: 129.0, valor_anual: 1290.0 },
  teste:     { nome: "Teste",          valor_mensal: 1.0,   valor_anual: 1.0 },
};

// statement_descriptor: max 22 chars (MP docs)
const STATEMENT_DESCRIPTOR = "NEXSILES";

function uuidv4(): string {
  // crypto.randomUUID é padrão no Deno Deploy — fallback defensivo
  return (globalThis.crypto?.randomUUID?.() as string) ??
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    const planoInfo = PLANOS[plano] ?? PLANOS.nexsiles;
    const valor = periodo === "anual" ? planoInfo.valor_anual : planoInfo.valor_mensal;
    const descricao = `${planoInfo.nome} — Assinatura ${periodo === "anual" ? "Anual" : "Mensal"}`;

    const origin = req.headers.get("origin") || "https://nexsiles.com.br";
    const externalReference = `nx:${plano}:${periodo}:${email}:${Date.now()}`;

    // Validade da preferência: 24h (janela para o usuário finalizar)
    // MP exige formato "yyyy-MM-ddTHH:mm:ss.SSS-03:00" representando o horário
    // real em São Paulo. Simplesmente trocar "Z" por "-03:00" faz o MP achar
    // que o horário está 3h no futuro e bloqueia a compra ("disponível a partir de...").
    const toMpDate = (d: Date) => {
      const sp = new Date(d.getTime() - 3 * 60 * 60 * 1000); // UTC -> BRT wall clock
      return sp.toISOString().replace("Z", "-03:00");
    };
    const now = new Date();
    const expiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);


    // Estrutura conforme /checkout/preferences (Checkout Pro)
    const preferenceData = {
      items: [
        {
          id: `${plano}-${periodo}`,
          title: descricao,
          description: `Plataforma Nexsiles — ${planoInfo.nome}`,
          category_id: "services",
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(valor.toFixed(2)),
        },
      ],
      payer: { email },
      back_urls: {
        success: `${origin}/landing?pagamento=sucesso&email=${encodeURIComponent(email)}`,
        failure: `${origin}/landing?pagamento=erro&email=${encodeURIComponent(email)}`,
        pending: `${origin}/landing?pagamento=pendente&email=${encodeURIComponent(email)}`,
      },
      auto_return: "approved",
      // Métodos de pagamento — habilita PIX/Boleto/Cartão e até 12x
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
        default_installments: 1,
      },
      // Nunca use binary_mode:true — bloqueia PIX/Boleto (fluxos assíncronos)
      binary_mode: false,
      external_reference: externalReference,
      metadata: {
        plano,
        periodo,
        valor,
        email,
        source: "landing_public_checkout",
      },
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook?source_news=webhooks`,
      statement_descriptor: STATEMENT_DESCRIPTOR,
      expires: true,
      // margem de 5min pra trás evita rejeição por drift de relógio no MP
      expiration_date_from: toMpDate(new Date(now.getTime() - 5 * 60 * 1000)),
      expiration_date_to: toMpDate(expiration),

    };

    const idempotencyKey = uuidv4();

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        // Header oficial recomendado pelo MP para evitar preferências duplicadas
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error("Mercado Pago error:", mpResponse.status, errorData);
      return new Response(
        JSON.stringify({ error: "Erro ao criar preferência de pagamento", details: errorData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const preference = await mpResponse.json();
    console.log("Preference created:", preference.id, "ext_ref:", externalReference);

    // Detecta ambiente pelo token (APP_USR = produção, TEST = sandbox)
    const isProd = MERCADOPAGO_ACCESS_TOKEN.startsWith("APP_USR-");
    const checkoutUrl = isProd ? preference.init_point : preference.sandbox_init_point;

    return new Response(
      JSON.stringify({
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        checkoutUrl,
        externalReference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in mercadopago-checkout-public:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
