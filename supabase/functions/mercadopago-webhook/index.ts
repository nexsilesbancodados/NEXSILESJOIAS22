import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Mercado Pago sends different notification types
    if (body.type === "payment" || body.action === "payment.created" || body.action === "payment.updated") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // Get payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      if (!paymentResponse.ok) {
        console.error("Failed to get payment details");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const payment = await paymentResponse.json();
      console.log("Payment details:", JSON.stringify(payment));

      // Only process approved payments
      if (payment.status !== "approved") {
        console.log(`Payment status is ${payment.status}, not processing`);
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // Parse external reference
      let externalRef;
      try {
        externalRef = JSON.parse(payment.external_reference);
      } catch {
        console.error("Failed to parse external_reference:", payment.external_reference);
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const { plano, periodo, valor, email: userEmail } = externalRef;
      const payerEmail = userEmail || payment.payer?.email;

      if (!plano || !payerEmail) {
        console.error("Missing plano or email in external_reference/payment");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // Check if we already processed this payment
      const { data: existingCode } = await supabase
        .from('codigos_acesso')
        .select('id')
        .eq('mercadopago_payment_id', String(paymentId))
        .maybeSingle();

      if (existingCode) {
        console.log("Payment already processed");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // Generate access code
      const { data: codigoData, error: codigoError } = await supabase
        .rpc('gerar_codigo_acesso');

      if (codigoError) {
        console.error("Error generating code:", codigoError);
        throw codigoError;
      }

      const codigo = codigoData as string;
      const validoAte = new Date();
      validoAte.setDate(validoAte.getDate() + 30); // Valid for 30 days

      // Save code to database
      const { error: insertError } = await supabase
        .from('codigos_acesso')
        .insert({
          codigo,
          email: payerEmail,
          plano,
          valor_pago: valor,
          mercadopago_payment_id: String(paymentId),
          valido_ate: validoAte.toISOString(),
        });

      if (insertError) {
        console.error("Error inserting code:", insertError);
        throw insertError;
      }

      console.log(`Access code ${codigo} generated for ${payerEmail}`);

      // Send email with access code
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        
        const planoNome = plano === 'nexsiles_max' ? 'Nexsiles Max' : 'Nexsiles';
        
        await resend.emails.send({
          from: "Nexsiles <suporte@nexsiles.online>",
          to: [payerEmail],
          subject: `🎉 Seu código de acesso ao ${planoNome}`,
          html: `
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
                    <ol>
                      <li>Acesse nosso sistema</li>
                      <li>Clique em "Criar Conta"</li>
                      <li>Insira o código acima</li>
                      <li>Complete seu cadastro</li>
                    </ol>
                  </p>
                  
                  <center>
                    <a href="https://nexsiles2567.lovable.app/auth" class="button">
                      Criar Minha Conta
                    </a>
                  </center>
                </div>
                <div class="footer">
                  <p>© 2024 Nexsiles. Todos os direitos reservados.</p>
                  <p>Dúvidas? Entre em contato: suporte@nexsiles.online</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log("Access code email sent to:", payerEmail);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error in mercadopago-webhook:", error);
    // Always return 200 to Mercado Pago to prevent retries
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
