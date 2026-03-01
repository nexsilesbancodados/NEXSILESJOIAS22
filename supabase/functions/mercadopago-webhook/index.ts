import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmailBrevo(apiKey: string, to: { email: string; name?: string }, from: { email: string; name: string }, subject: string, htmlContent: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: from.name, email: from.email },
      to: [{ email: to.email, name: to.name || to.email }],
      subject,
      htmlContent,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error [${res.status}]: ${err}`);
  }
  return await res.json();
}

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

    // Handle both Webhook (JSON body) and IPN (query params) formats
    const url = new URL(req.url);
    let paymentId: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Webhook format: JSON body with { type, action, data: { id } }
      const body = await req.json();
      console.log("Webhook received (JSON):", JSON.stringify(body));

      if (body.type === "payment" || body.action === "payment.created" || body.action === "payment.updated") {
        paymentId = body.data?.id ? String(body.data.id) : null;
      } else {
        console.log("Ignoring non-payment webhook type:", body.type, body.action);
        return new Response("OK", { status: 200, headers: corsHeaders });
      }
    } else {
      // IPN format: query params ?topic=payment&id=123
      const topic = url.searchParams.get("topic") || url.searchParams.get("type");
      const id = url.searchParams.get("id") || url.searchParams.get("data.id");
      console.log("Webhook received (IPN):", { topic, id });

      if (topic === "payment" && id) {
        paymentId = id;
      } else {
        // Also try reading body as form-urlencoded or plain text
        try {
          const body = await req.json();
          if (body.type === "payment" || body.action?.startsWith("payment.")) {
            paymentId = body.data?.id ? String(body.data.id) : null;
          }
        } catch {
          console.log("No parseable body, ignoring. Topic:", topic);
        }
        if (!paymentId) {
          return new Response("OK", { status: 200, headers: corsHeaders });
        }
      }
    }

    if (!paymentId) {
      console.log("No payment ID found");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    console.log("Processing payment ID:", paymentId);

    // Fetch payment details from Mercado Pago API
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
    });

    if (!paymentResponse.ok) {
      console.error("Failed to get payment details:", paymentResponse.status);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const payment = await paymentResponse.json();
    console.log("Payment status:", payment.status, "ID:", payment.id, "amount:", payment.transaction_amount);

    if (payment.status !== "approved") {
      console.log(`Payment status is ${payment.status}, not processing`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Extract subscription data from metadata or external_reference
    let plano: string | undefined;
    let periodo: string | undefined;
    let valor: number | undefined;
    let userEmail: string | undefined;
    let userId: string | undefined;

    if (payment.metadata?.plano) {
      plano = payment.metadata.plano;
      periodo = payment.metadata.periodo;
      valor = payment.metadata.valor;
      userEmail = payment.metadata.email;
      userId = payment.metadata.user_id;
      console.log("Using metadata for subscription data");
    } else {
      try {
        const externalRef = JSON.parse(payment.external_reference);
        plano = externalRef.plano;
        periodo = externalRef.periodo;
        valor = externalRef.valor;
        userEmail = externalRef.email;
        console.log("Using legacy external_reference JSON");
      } catch {
        const extRef = payment.external_reference || "";
        const match = extRef.match(/^assinatura_([a-f0-9-]+)_(\w+)_(\w+)_/);
        if (match) {
          userId = match[1];
          plano = match[2];
          periodo = match[3];
          valor = payment.transaction_amount;
          userEmail = payment.payer?.email;
          console.log("Parsed new external_reference format");
        } else {
          console.error("Could not parse external_reference:", payment.external_reference);
          return new Response("OK", { status: 200, headers: corsHeaders });
        }
      }
    }

    const payerEmail = userEmail || payment.payer?.email;

    if (!plano || !payerEmail) {
      console.error("Missing plano or email");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Check idempotency - avoid duplicate processing
    const { data: existingCode } = await supabase
      .from('codigos_acesso')
      .select('id')
      .eq('mercadopago_payment_id', String(paymentId))
      .maybeSingle();

    if (existingCode) {
      console.log("Payment already processed (idempotent)");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Generate access code
    const { data: codigoData, error: codigoError } = await supabase.rpc('gerar_codigo_acesso');
    if (codigoError) {
      console.error("Error generating code:", codigoError);
      throw codigoError;
    }

    const codigo = codigoData as string;
    const validoAte = new Date();
    validoAte.setDate(validoAte.getDate() + 30);

    const { error: insertError } = await supabase
      .from('codigos_acesso')
      .insert({
        codigo,
        email: payerEmail,
        plano,
        valor_pago: valor || payment.transaction_amount || 0,
        mercadopago_payment_id: String(paymentId),
        valido_ate: validoAte.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting code:", insertError);
      throw insertError;
    }

    console.log(`Access code ${codigo} generated for ${payerEmail}`);

    // Send email with access code via Brevo
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (brevoKey) {
      try {
        const planoNome = plano === 'nexsiles_max' ? 'Nexsiles Max' : 'Nexsiles';

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 30px; }
              .code-box { background: #fef3c7; border: 2px dashed #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .code { font-size: 32px; font-weight: bold; color: #92400e; letter-spacing: 4px; font-family: monospace; }
              .info { color: #666; font-size: 14px; line-height: 1.6; }
              .button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Pagamento Confirmado!</h1>
              </div>
              <div class="content">
                <p>Olá!</p>
                <p>Seu pagamento do plano <strong>${planoNome}</strong> foi confirmado!</p>
                <p>Use o código abaixo para criar sua conta:</p>
                
                <div class="code-box">
                  <div class="code">${codigo}</div>
                  <p style="margin-top: 10px; color: #666; font-size: 12px;">Válido por 30 dias</p>
                </div>
                
                <p class="info">
                  Para começar a usar o Nexsiles:
                </p>
                <ol class="info">
                  <li>Acesse nosso sistema</li>
                  <li>Clique em "Criar Conta"</li>
                  <li>Insira o código acima</li>
                  <li>Complete seu cadastro</li>
                </ol>
                
                <center>
                  <a href="https://nexsiles2567.lovable.app/auth" class="button">
                    Criar Minha Conta
                  </a>
                </center>
              </div>
              <div class="footer">
                <p>© 2026 Nexsiles. Todos os direitos reservados.</p>
                <p>Dúvidas? Entre em contato: contato@nexsiles.com.br</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmailBrevo(
          brevoKey,
          { email: payerEmail },
          { email: "contato@nexsiles.com.br", name: "NexSiles" },
          `🎉 Seu código de acesso ao ${planoNome}`,
          html
        );

        console.log("Access code email sent via Brevo to:", payerEmail);
      } catch (emailErr: any) {
        console.error("Email send error:", emailErr.message || emailErr);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error in mercadopago-webhook:", error);
    // Always return 200 to avoid MP retries on our errors
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
