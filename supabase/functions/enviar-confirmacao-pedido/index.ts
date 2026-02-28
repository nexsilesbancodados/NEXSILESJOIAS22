import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoKey) throw new Error("BREVO_API_KEY não configurada");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { pedido_id } = await req.json();
    if (!pedido_id) {
      return new Response(JSON.stringify({ error: "pedido_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pedido, error: pedidoError } = await supabase
      .from("ecommerce_pedidos")
      .select("*")
      .eq("id", pedido_id)
      .single();

    if (pedidoError || !pedido) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pedido.cliente_email) {
      return new Response(JSON.stringify({ error: "Cliente sem email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: itens } = await supabase
      .from("ecommerce_pedido_itens")
      .select("*, pecas:peca_id(nome, codigo, imagem_url)")
      .eq("pedido_id", pedido_id);

    const { data: storeConfig } = await supabase
      .from("ecommerce_config")
      .select("nome_loja, whatsapp, cor_primaria")
      .eq("organization_id", pedido.organization_id)
      .single();

    const nomeLoja = storeConfig?.nome_loja || "Nossa Loja";
    const corPrimaria = storeConfig?.cor_primaria || "#B76E79";
    const whatsapp = storeConfig?.whatsapp || "";

    const formatCurrency = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const itensHtml = (itens || [])
      .map((item: any) => {
        const nome = item.pecas?.nome || "Produto";
        const codigo = item.pecas?.codigo || "";
        return `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f0e6e0;">
              <strong style="color: #2D2D2D;">${nome}</strong>
              ${codigo ? `<br><span style="color: #7A7A7A; font-size: 12px;">Cód: ${codigo}</span>` : ""}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f0e6e0; text-align: center; color: #2D2D2D;">${item.quantidade}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f0e6e0; text-align: right; color: #2D2D2D;">${formatCurrency(item.preco_unitario * item.quantidade)}</td>
          </tr>`;
      })
      .join("");

    const desconto = pedido.valor_desconto || 0;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #FFF9F5; font-family: 'Georgia', serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: ${corPrimaria}; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0; letter-spacing: 3px; text-transform: uppercase;">${nomeLoja}</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #2D2D2D; font-size: 22px; margin: 0 0 5px 0; font-weight: normal;">Pedido Confirmado! ✨</h2>
      <p style="color: #7A7A7A; font-size: 14px; margin: 0 0 25px 0;">
        Olá, <strong>${pedido.cliente_nome}</strong>! Seu pedido <strong>#${pedido.numero_pedido}</strong> foi realizado com sucesso.
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="border-bottom: 2px solid ${corPrimaria};">
            <th style="padding: 10px 0; text-align: left; color: ${corPrimaria}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Produto</th>
            <th style="padding: 10px 0; text-align: center; color: ${corPrimaria}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Qtd</th>
            <th style="padding: 10px 0; text-align: right; color: ${corPrimaria}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Valor</th>
          </tr>
        </thead>
        <tbody>${itensHtml}</tbody>
      </table>
      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid ${corPrimaria};">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #7A7A7A;">Subtotal</td>
            <td style="padding: 4px 0; text-align: right; color: #2D2D2D;">${formatCurrency(pedido.valor_subtotal)}</td>
          </tr>
          ${desconto > 0 ? `
          <tr>
            <td style="padding: 4px 0; color: ${corPrimaria};">Desconto</td>
            <td style="padding: 4px 0; text-align: right; color: ${corPrimaria};">-${formatCurrency(desconto)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 4px 0; color: #7A7A7A;">Frete</td>
            <td style="padding: 4px 0; text-align: right; color: #2D2D2D;">${pedido.valor_frete === 0 ? "Grátis" : formatCurrency(pedido.valor_frete)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold; color: #2D2D2D;">Total</td>
            <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: ${corPrimaria};">${formatCurrency(pedido.valor_total)}</td>
          </tr>
        </table>
      </div>
      <div style="margin-top: 30px; padding: 20px; background-color: #FFF9F5; border-left: 3px solid ${corPrimaria};">
        <p style="margin: 0; font-size: 13px; color: #7A7A7A;">
          Você receberá atualizações sobre o envio do seu pedido.
          ${whatsapp ? `<br><br>Dúvidas? Entre em contato pelo WhatsApp: <strong>${whatsapp}</strong>` : ""}
        </p>
      </div>
    </div>
    <div style="background-color: #2D2D2D; padding: 25px; text-align: center;">
      <p style="color: #D4A0A7; font-size: 14px; letter-spacing: 2px; margin: 0 0 8px 0; text-transform: uppercase;">${nomeLoja}</p>
      <p style="color: #6A6A6A; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmailBrevo(
      brevoKey,
      { email: pedido.cliente_email, name: pedido.cliente_nome },
      { email: "noreply@nexsales.online", name: nomeLoja },
      `✅ Pedido #${pedido.numero_pedido} confirmado! - ${nomeLoja}`,
      html
    );

    await supabase.from("email_logs").insert({
      organization_id: pedido.organization_id,
      destinatario_email: pedido.cliente_email,
      destinatario_nome: pedido.cliente_nome,
      assunto: `Pedido #${pedido.numero_pedido} confirmado`,
      status: "enviado",
      enviado_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
