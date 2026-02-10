import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, dados } = await req.json();

    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's organization
    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) throw new Error("Organização não encontrada");

    // Get organization owner email
    const { data: ownerMembership } = await supabaseAdmin
      .from("memberships")
      .select("user_id")
      .eq("organization_id", membership.organization_id)
      .eq("role", "owner")
      .single();

    if (!ownerMembership) throw new Error("Admin não encontrado");

    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, nome")
      .eq("user_id", ownerMembership.user_id)
      .single();

    if (!ownerProfile?.email) throw new Error("Email do admin não encontrado");

    let subject = "";
    let html = "";

    switch (tipo) {
      case "venda_realizada": {
        const valor = Number(dados.valor || 0).toFixed(2);
        const itens = dados.itens || "N/A";
        const vendedor = dados.vendedor || "Sistema";
        subject = `💰 Nova venda registrada - R$ ${valor}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; border-bottom: 2px solid #9b87f5; padding-bottom: 10px;">Nova Venda Registrada</h2>
            <p style="font-size: 16px;">Uma nova venda foi registrada no sistema.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Valor:</strong> R$ ${valor}</p>
              <p><strong>Itens:</strong> ${itens}</p>
              <p><strong>Vendedor:</strong> ${vendedor}</p>
            </div>
          </div>`;
        break;
      }
      case "estoque_baixo": {
        const pecaNome = dados.peca_nome || "Peça";
        const quantidade = dados.quantidade ?? 0;
        subject = `⚠️ Estoque baixo - ${pecaNome}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #e53e3e; border-bottom: 2px solid #e53e3e; padding-bottom: 10px;">⚠️ Alerta de Estoque Baixo</h2>
            <p style="font-size: 16px;">Uma peça atingiu nível crítico de estoque.</p>
            <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fed7d7;">
              <p><strong>Peça:</strong> ${pecaNome}</p>
              <p><strong>Quantidade restante:</strong> ${quantidade} unidade(s)</p>
            </div>
            <p style="color: #666;">Recomendamos reabastecer o estoque o mais rápido possível.</p>
          </div>`;
        break;
      }
      case "maleta_vencendo": {
        const maletaNome = dados.maleta_nome || "Maleta";
        const revendedora = dados.revendedora || "N/A";
        const diasRestantes = dados.dias_restantes ?? 0;
        subject = `📦 Maleta "${maletaNome}" vencendo em ${diasRestantes} dia(s)`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #d69e2e; border-bottom: 2px solid #d69e2e; padding-bottom: 10px;">📦 Maleta Próxima do Vencimento</h2>
            <div style="background: #fffff0; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fefcbf;">
              <p><strong>Maleta:</strong> ${maletaNome}</p>
              <p><strong>Revendedora:</strong> ${revendedora}</p>
              <p><strong>Dias restantes:</strong> ${diasRestantes}</p>
            </div>
          </div>`;
        break;
      }
      case "novo_pedido_catalogo": {
        const clienteNome = dados.cliente_nome || "Cliente";
        const catalogoNome = dados.catalogo_nome || "Catálogo";
        const valorTotal = Number(dados.valor_total || 0).toFixed(2);
        subject = `🛒 Novo pedido no catálogo "${catalogoNome}"`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #38a169; border-bottom: 2px solid #38a169; padding-bottom: 10px;">🛒 Novo Pedido Recebido</h2>
            <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c6f6d5;">
              <p><strong>Cliente:</strong> ${clienteNome}</p>
              <p><strong>Catálogo:</strong> ${catalogoNome}</p>
              <p><strong>Valor Total:</strong> R$ ${valorTotal}</p>
            </div>
          </div>`;
        break;
      }
      default:
        subject = `📋 Notificação do Sistema`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Notificação</h2>
            <p>${JSON.stringify(dados)}</p>
          </div>`;
    }

    const emailResponse = await resend.emails.send({
      from: "Nexsiles <noreply@nexsiles.online>",
      to: [ownerProfile.email],
      subject,
      html,
    });

    console.log("Email notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notificar-eventos:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
