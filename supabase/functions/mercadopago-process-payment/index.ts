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

    const body = await req.json();
    const { plano, periodo, email: bodyEmail, nome, cpf, telefone, ...paymentData } = body;

    // Try to get user from auth header (authenticated flow)
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("authorization");
    
    if (authHeader && authHeader !== "Bearer undefined" && authHeader !== "Bearer null") {
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
          userEmail = user.email || null;
        }
      } catch {
        // Auth failed, continue as public checkout
      }
    }

    // For public checkout, use email from body
    if (!userEmail) {
      userEmail = bodyEmail;
    }

    if (!userEmail) {
      throw new Error("Email é obrigatório");
    }

    if (!plano) {
      throw new Error("Plano é obrigatório");
    }

    console.log("Processing payment for:", userEmail, "plan:", plano, "authenticated:", !!userId);

    const PLANOS_CONFIG: Record<string, { nome: string; valor_mensal: number; valor_anual: number }> = {
      nexsiles: { nome: "Nexsiles", valor_mensal: 189, valor_anual: 1890 },
      nexsiles_max: { nome: "Nexsiles Max", valor_mensal: 249, valor_anual: 2490 },
    };

    const planoConfig = PLANOS_CONFIG[plano];
    if (!planoConfig) {
      throw new Error("Plano inválido");
    }

    const valor = periodo === 'anual' ? planoConfig.valor_anual : planoConfig.valor_mensal;
    const diasValidade = periodo === 'anual' ? 365 : 30;

    // If paymentData has token or payment_method_id, process as direct payment
    // Otherwise, create a preference for redirect flow
    const hasDirectPaymentData = paymentData.token || paymentData.payment_method_id;

    if (hasDirectPaymentData) {
      // Direct payment via MP API (from Payment Brick)
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          "X-Idempotency-Key": `${userEmail}-${plano}-${Date.now()}`,
        },
        body: JSON.stringify({
          ...paymentData,
          transaction_amount: paymentData.transaction_amount || valor,
          description: `Assinatura ${planoConfig.nome} - ${periodo === 'anual' ? 'Anual' : 'Mensal'}`,
          payer: {
            ...paymentData.payer,
            email: userEmail,
          },
          external_reference: JSON.stringify({
            plano,
            periodo,
            user_id: userId,
            email: userEmail,
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
            status_detail: payment.message || payment.cause?.[0]?.description || "Erro ao processar pagamento",
            error: payment,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If payment is approved, activate subscription
      if (payment.status === "approved") {
        await activateSubscription(supabase, userId, userEmail, plano, planoConfig, valor, diasValidade, payment.id);
      }

      return new Response(
        JSON.stringify({
          status: payment.status,
          status_detail: payment.status_detail,
          payment_id: payment.id,
          payment_method_id: payment.payment_method_id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // No direct payment data - create preference for redirect checkout
      const origin = req.headers.get("origin") || "https://www.nexsiles.com.br";
      
      const preferenceData = {
        items: [{
          title: `${planoConfig.nome} - ${periodo === 'anual' ? 'Anual' : 'Mensal'}`,
          description: `Assinatura ${planoConfig.nome}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: valor,
        }],
        payer: {
          email: userEmail,
          name: nome || undefined,
          identification: cpf ? { type: "CPF", number: cpf.replace(/\D/g, '') } : undefined,
        },
        back_urls: {
          success: `${origin}/planos?success=true&email=${encodeURIComponent(userEmail)}`,
          failure: `${origin}/planos?canceled=true`,
          pending: `${origin}/planos?success=true`,
        },
        auto_return: "approved",
        external_reference: JSON.stringify({
          plano,
          periodo,
          valor,
          email: userEmail,
          user_id: userId,
        }),
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        statement_descriptor: "NEXSILES",
      };

      console.log("Creating preference for:", userEmail);

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
        console.error("MP Preference error:", errorData);
        throw new Error(`Erro ao criar preferência: ${errorData}`);
      }

      const preference = await mpResponse.json();
      console.log("Preference created:", preference.id);

      return new Response(
        JSON.stringify({
          status: "redirect",
          preferenceId: preference.id,
          initPoint: preference.init_point,
          sandboxInitPoint: preference.sandbox_init_point,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error in mercadopago-process-payment:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        status_detail: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function activateSubscription(
  supabase: any,
  userId: string | null,
  email: string,
  plano: string,
  planoConfig: { nome: string; valor_mensal: number },
  valor: number,
  diasValidade: number,
  paymentId: string | number
) {
  const dataVencimento = new Date();
  dataVencimento.setDate(dataVencimento.getDate() + diasValidade);

  // If we have a userId, upsert directly
  if (userId) {
    const { error } = await supabase
      .from('assinaturas')
      .upsert({
        user_id: userId,
        plano,
        status: 'ativo',
        data_inicio: new Date().toISOString(),
        data_vencimento: dataVencimento.toISOString(),
        valor_mensal: planoConfig.valor_mensal,
        mercadopago_payment_id: String(paymentId),
        metodo_pagamento: 'mercadopago',
        ultimo_pagamento_em: new Date().toISOString(),
        trial_ativo: false,
      }, { onConflict: 'user_id' });

    if (error) {
      console.error("Error upserting subscription:", error);
    } else {
      console.log(`Subscription activated for user ${userId}, plan ${plano}`);
    }
  } else {
    // Public checkout - generate access code for later activation
    const codigo = generateAccessCode();
    const validoAte = new Date();
    validoAte.setDate(validoAte.getDate() + diasValidade);

    const { error } = await supabase
      .from('codigos_acesso')
      .insert({
        codigo,
        email,
        plano,
        valor_pago: valor,
        valido_ate: validoAte.toISOString(),
        mercadopago_payment_id: String(paymentId),
      });

    if (error) {
      console.error("Error creating access code:", error);
    } else {
      console.log(`Access code ${codigo} created for ${email}, plan ${plano}`);
    }
  }
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
