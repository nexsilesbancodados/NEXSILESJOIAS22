import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const body = await req.json();
    const { plano, periodo, ...paymentData } = body;

    console.log("Processing payment for user:", user.id, "plan:", plano);
    console.log("Payment data keys:", Object.keys(paymentData));

    // Process payment via Mercado Pago API
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "X-Idempotency-Key": `${user.id}-${plano}-${Date.now()}`,
      },
      body: JSON.stringify({
        ...paymentData,
        description: `Assinatura ${plano === 'nexsiles_max' ? 'Nexsiles Max' : 'Nexsiles'} - ${periodo === 'anual' ? 'Anual' : 'Mensal'}`,
        external_reference: JSON.stringify({
          plano,
          periodo,
          user_id: user.id,
          email: user.email,
        }),
        statement_descriptor: "NEXSILES",
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      }),
    });

    const payment = await mpResponse.json();
    console.log("MP Payment result:", JSON.stringify({
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    }));

    if (!mpResponse.ok) {
      console.error("MP Error:", JSON.stringify(payment));
      return new Response(
        JSON.stringify({
          status: "rejected",
          status_detail: payment.message || "Erro ao processar pagamento",
          error: payment,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If payment is approved, activate subscription immediately
    if (payment.status === "approved") {
      const PLANOS_CONFIG: Record<string, { nome: string; valor_mensal: number; valor_anual: number }> = {
        nexsiles: { nome: "Nexsiles", valor_mensal: 189, valor_anual: 1890 },
        nexsiles_max: { nome: "Nexsiles Max", valor_mensal: 249, valor_anual: 2490 },
      };

      const planoConfig = PLANOS_CONFIG[plano];
      const valor = periodo === 'anual' ? planoConfig.valor_anual : planoConfig.valor_mensal;
      const diasValidade = periodo === 'anual' ? 365 : 30;

      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + diasValidade);

      // Upsert subscription
      const { error: subError } = await supabase
        .from('assinaturas')
        .upsert({
          user_id: user.id,
          plano: plano,
          status: 'ativo',
          data_inicio: new Date().toISOString(),
          data_vencimento: dataVencimento.toISOString(),
          valor_mensal: planoConfig.valor_mensal,
          mercadopago_payment_id: String(payment.id),
          metodo_pagamento: 'mercadopago',
          ultimo_pagamento_em: new Date().toISOString(),
          trial_ativo: false,
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error("Error upserting subscription:", subError);
      } else {
        console.log(`Subscription activated for user ${user.id}, plan ${plano}`);
      }
    }

    return new Response(
      JSON.stringify({
        status: payment.status,
        status_detail: payment.status_detail,
        payment_id: payment.id,
        payment_method_id: payment.payment_method_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in mercadopago-process-payment:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        status_detail: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
