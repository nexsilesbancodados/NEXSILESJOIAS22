import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendBrevoEmail(to: string, subject: string, htmlContent: string) {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "NexSiles", email: "contato@nexsiles.com.br" },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });
    if (!res.ok) {
      console.error("Brevo error:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Brevo send failed:", e);
    return false;
  }
}

interface GerarCodigoRequest {
  email: string;
  plano: 'nexsiles' | 'nexsiles_max';
  valor_pago: number;
  mercadopago_payment_id?: string;
}

interface ValidarCodigoRequest {
  codigo: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "gerar";

    if (action === "gerar") {
      const body: GerarCodigoRequest = await req.json();
      const { email, plano, valor_pago, mercadopago_payment_id } = body;

      if (!email || !plano || valor_pago === undefined) {
        return new Response(
          JSON.stringify({ error: "Email, plano e valor_pago são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: codigoData, error: codigoError } = await supabase.rpc('gerar_codigo_acesso');
      if (codigoError) throw codigoError;

      const codigo = codigoData as string;
      const validoAte = new Date();
      validoAte.setDate(validoAte.getDate() + 30);

      const { error: insertError } = await supabase
        .from('codigos_acesso')
        .insert({ codigo, email, plano, valor_pago, mercadopago_payment_id, valido_ate: validoAte.toISOString() });

      if (insertError) throw insertError;

      const planoNome = plano === 'nexsiles_max' ? 'Nexsiles Max' : 'Nexsiles';

      await sendBrevoEmail(email, `🎉 Seu código de acesso ao ${planoNome}`, `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
          <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
            <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:30px;text-align:center">
              <h1 style="color:white;margin:0;font-size:24px">🎉 Bem-vindo ao Nexsiles!</h1>
            </div>
            <div style="padding:30px">
              <p>Olá!</p>
              <p>Seu pagamento do plano <strong>${planoNome}</strong> foi confirmado!</p>
              <p>Use o código abaixo para criar sua conta:</p>
              <div style="background:#fef3c7;border:2px dashed #f59e0b;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
                <div style="font-size:32px;font-weight:bold;color:#92400e;letter-spacing:4px;font-family:monospace">${codigo}</div>
                <p style="margin-top:10px;color:#666;font-size:12px">Válido por 30 dias</p>
              </div>
              <p>Para começar: acesse o sistema → Criar Conta → insira o código.</p>
              <center><a href="https://nexsiles2567.lovable.app/auth" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px">Criar Minha Conta</a></center>
            </div>
            <div style="background:#f9fafb;padding:20px;text-align:center;color:#9ca3af;font-size:12px">
              <p>© Nexsiles. Todos os direitos reservados.</p>
            </div>
          </div>
        </body></html>
      `);

      console.log("Access code email sent to:", email);

      return new Response(
        JSON.stringify({ success: true, codigo, message: "Código gerado e enviado por email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "validar") {
      const body: ValidarCodigoRequest = await req.json();
      const { codigo, user_id } = body;

      if (!codigo || !user_id) {
        return new Response(
          JSON.stringify({ error: "Código e user_id são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: codigoData, error: findError } = await supabase
        .from('codigos_acesso')
        .select('*')
        .eq('codigo', codigo.toUpperCase())
        .eq('usado', false)
        .gte('valido_ate', new Date().toISOString())
        .maybeSingle();

      if (findError || !codigoData) {
        return new Response(
          JSON.stringify({ error: "Código inválido, já usado ou expirado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from('codigos_acesso')
        .update({ usado: true, usado_por: user_id, usado_em: new Date().toISOString() })
        .eq('id', codigoData.id);

      const dataInicio = new Date();
      const dataVencimento = new Date();
      dataVencimento.setMonth(dataVencimento.getMonth() + 1);

      const { error: subscriptionError } = await supabase
        .from('assinaturas')
        .upsert({
          user_id,
          plano: codigoData.plano,
          status: 'ativo',
          data_inicio: dataInicio.toISOString(),
          data_vencimento: dataVencimento.toISOString(),
          valor_mensal: codigoData.valor_pago,
          metodo_pagamento: 'pix',
          trial_ativo: false,
        }, { onConflict: 'user_id' });

      if (subscriptionError) throw subscriptionError;

      return new Response(
        JSON.stringify({ success: true, plano: codigoData.plano, message: "Código validado e assinatura criada" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Ação inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

Deno.serve(handler);
