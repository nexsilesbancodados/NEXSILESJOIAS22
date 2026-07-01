import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmailBrevo(apiKey: string, to: string, toName: string, subject: string, htmlContent: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "NexSiles", email: "contato@nexsiles.com.br" },
      to: [{ email: to, name: toName || to }],
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
      case "boas_vindas": {
        const planoNome = dados.plano_nome || "Nexsiles";
        const diasValidade = dados.dias_validade || 30;
        const isTrial = dados.is_trial || false;
        subject = `🎉 Bem-vindo(a) ao Nexsiles!`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6; margin: 0; font-size: 28px;">Nexsiles</h1>
              <p style="color: #666; margin-top: 5px;">Sistema de Gestão de Joias</p>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">🎉 Bem-vindo(a), ${ownerProfile.nome || 'Cliente'}!</h2>
              <p style="font-size: 16px; color: #555;">
                ${isTrial 
                  ? `Seu <strong>teste grátis de ${diasValidade} dias</strong> do plano <strong>${planoNome}</strong> foi ativado com sucesso!`
                  : `Seu plano <strong>${planoNome}</strong> foi ativado com sucesso!`
                }
              </p>
              <p style="font-size: 16px; color: #555;">Agora você tem acesso completo a todas as funcionalidades:</p>
              <ul style="color: #555; line-height: 2;">
                <li>📦 Gestão de peças e estoque</li>
                <li>💰 Controle de vendas (PDV)</li>
                <li>👜 Gestão de revendedoras e maletas</li>
                <li>📋 Catálogos digitais</li>
                <li>📊 Relatórios completos</li>
                ${planoNome === 'Nexsiles Max' ? '<li>🤖 Atendente de IA integrado</li><li>💬 Chatbot WhatsApp automatizado</li>' : ''}
              </ul>
              <div style="text-align: center; margin-top: 25px;">
                <a href="https://nexsiles.com.br" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #A855F7); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Acessar o Sistema
                </a>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 12px;">
              <p>Dúvidas? Responda este email ou acesse nosso suporte.</p>
            </div>
          </div>`;
        break;
      }
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
      case "envio_atualizado": {
        const destinatario = dados.destinatario_nome || "Cliente";
        const rastreio = dados.codigo_rastreio || "N/A";
        const transportadora = dados.transportadora || "N/A";
        const statusEnvio = dados.status || "enviado";
        subject = `📦 Envio atualizado - ${destinatario}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3182ce; border-bottom: 2px solid #3182ce; padding-bottom: 10px;">📦 Envio Atualizado</h2>
            <div style="background: #ebf8ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bee3f8;">
              <p><strong>Destinatário:</strong> ${destinatario}</p>
              <p><strong>Status:</strong> ${statusEnvio}</p>
              <p><strong>Transportadora:</strong> ${transportadora}</p>
              <p><strong>Rastreio:</strong> ${rastreio}</p>
            </div>
          </div>`;
        break;
      }
      case "pos_venda": {
        const clienteNomeVenda = dados.cliente_nome || "Cliente";
        const valorVenda = Number(dados.valor || 0).toFixed(2);
        subject = `✨ Obrigado pela compra, ${clienteNomeVenda}!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 30px; border-radius: 12px; text-align: center; color: white;">
              <h1 style="margin: 0;">✨ Obrigado pela Compra!</h1>
            </div>
            <div style="padding: 20px;">
              <p style="font-size: 16px; color: #555;">Olá, <strong>${clienteNomeVenda}</strong>!</p>
              <p style="font-size: 16px; color: #555;">Foi um prazer atendê-lo(a)! Sua compra de <strong>R$ ${valorVenda}</strong> foi registrada.</p>
              <p style="font-size: 14px; color: #777;">Esperamos que aproveite suas novas peças! Volte sempre! 💎</p>
            </div>
          </div>`;
        break;
      }
      case "reativacao_cliente": {
        const clienteNomeReat = dados.cliente_nome || "Cliente";
        const diasInativo = dados.dias_inativo || 30;
        subject = `💎 Sentimos sua falta, ${clienteNomeReat}!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8B5CF6;">💎 Sentimos sua falta!</h2>
            <p style="font-size: 16px; color: #555;">Olá, <strong>${clienteNomeReat}</strong>!</p>
            <p style="font-size: 16px; color: #555;">Faz ${diasInativo} dias desde sua última visita e temos muitas novidades!</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="font-size: 20px; font-weight: bold; color: #92400e; margin: 0;">🎁 DESCONTO ESPECIAL</p>
              <p style="color: #92400e; margin: 8px 0 0;">Visite-nos e ganhe condições exclusivas!</p>
            </div>
          </div>`;
        break;
      }
      case "novo_pedido_ecommerce": {
        const clienteEcom = dados.cliente_nome || "Cliente";
        const numeroPedido = dados.numero_pedido || "N/A";
        const valorEcom = Number(dados.valor_total || 0).toFixed(2);
        const nomeLoja = dados.nome_loja || "Loja";
        subject = `🛒 Novo pedido #${numeroPedido} - ${nomeLoja}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #38a169;">🛒 Novo Pedido E-commerce!</h2>
            <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c6f6d5;">
              <p><strong>Pedido:</strong> #${numeroPedido}</p>
              <p><strong>Cliente:</strong> ${clienteEcom}</p>
              <p><strong>Valor:</strong> R$ ${valorEcom}</p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://nexsiles.com.br/loja-virtual" style="display: inline-block; background: #38a169; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver Pedidos</a>
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

    const emailResponse = await sendEmailBrevo(brevoKey, ownerProfile.email, ownerProfile.nome || 'Admin', subject, html);
    console.log("Email notification sent via Brevo:", emailResponse);

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
