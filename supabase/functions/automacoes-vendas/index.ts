import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireCronSecret } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Helper to send email via Brevo
async function sendEmailBrevo(apiKey: string, to: { email: string; name?: string }, from: { email: string; name: string }, subject: string, htmlContent: string): Promise<boolean> {
  try {
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
      console.error(`Brevo error [${res.status}]: ${err}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Brevo send error:', e);
    return false;
  }
}

// Helper to send WhatsApp via Evolution API
async function sendWhatsApp(phone: string, message: string, instanceName: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  if (!evolutionUrl || !evolutionKey) return false;

  try {
    let tel = phone.replace(/\D/g, '');
    if (!tel.startsWith('55')) tel = '55' + tel;

    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
      body: JSON.stringify({ number: tel, text: message }),
    });
    return response.ok;
  } catch (e) {
    console.error('WhatsApp send error:', e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const brevoKey = Deno.env.get('BREVO_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      pos_venda_whatsapp: 0,
      pos_venda_email: 0,
      reativacao: 0,
      ecommerce_whatsapp: 0,
      envio_notificacao: 0,
    };

    // Pre-load configs
    const { data: allConfigs } = await supabase
      .from('agente_ia_config')
      .select('organization_id, whatsapp_instancia, nome_agente');
    const configMap = new Map<string, any>();
    for (const c of allConfigs || []) {
      if (c.organization_id) configMap.set(c.organization_id, c);
    }

    // Pre-load ecommerce configs
    const { data: ecomConfigs } = await supabase
      .from('ecommerce_config')
      .select('organization_id, nome_loja, whatsapp');
    const ecomMap = new Map<string, any>();
    for (const c of ecomConfigs || []) {
      if (c.organization_id) ecomMap.set(c.organization_id, c);
    }

    // ═══════════════════════════════════════════
    // 1. PÓS-VENDA AUTOMÁTICO (PDV) - Thank you WhatsApp 2h depois
    // ═══════════════════════════════════════════
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data: vendasRecentes } = await supabase
      .from('vendas')
      .select('id, valor_total, cliente_id, organization_id, created_at, clientes(nome, telefone, whatsapp, email)')
      .gte('created_at', threeHoursAgo)
      .lte('created_at', twoHoursAgo)
      .not('cliente_id', 'is', null);

    for (const venda of vendasRecentes || []) {
      if (!venda.organization_id) continue;

      const { data: existing } = await supabase
        .from('historico_atividades')
        .select('id')
        .eq('tabela', 'automacao_pos_venda')
        .eq('registro_id', venda.id)
        .limit(1);

      if (existing?.length) continue;

      const clienteData = venda.clientes as any;
      if (!clienteData) continue;

      const config = configMap.get(venda.organization_id);
      const tel = clienteData.whatsapp || clienteData.telefone;

      // Send WhatsApp thank you
      if (tel && config?.whatsapp_instancia) {
        const msg = `✨ *Obrigado pela compra, ${clienteData.nome}!*\n\nFoi um prazer atendê-lo(a)! Esperamos que aproveite suas novas peças. 💎\n\nSe tiver qualquer dúvida, estamos à disposição! 😊\n\nVolte sempre! 💖`;
        const sent = await sendWhatsApp(tel, msg, config.whatsapp_instancia);
        if (sent) results.pos_venda_whatsapp++;
        await new Promise(r => setTimeout(r, 500));
      }

      // Send email thank you via Brevo
      if (brevoKey && clienteData.email) {
        const sent = await sendEmailBrevo(
          brevoKey,
          { email: clienteData.email, name: clienteData.nome },
          { email: 'contato@nexsiles.com.br', name: 'NexSiles' },
          `✨ Obrigado pela compra, ${clienteData.nome}!`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#8B5CF6,#EC4899);padding:30px;border-radius:12px;text-align:center;color:white;">
              <h1 style="margin:0;font-size:24px;">✨ Obrigado pela Compra!</h1>
            </div>
            <div style="padding:20px;">
              <p style="font-size:16px;color:#555;">Olá, <strong>${clienteData.nome}</strong>!</p>
              <p style="font-size:16px;color:#555;">Foi um prazer atendê-lo(a)! Esperamos que aproveite suas novas peças. 💎</p>
              <p style="font-size:14px;color:#777;">Se tiver qualquer dúvida, estamos à disposição! Volte sempre! 💖</p>
            </div>
          </div>`
        );
        if (sent) results.pos_venda_email++;
      }

      // Log to avoid duplicates
      await supabase.from('historico_atividades').insert({
        tabela: 'automacao_pos_venda',
        acao: 'pos_venda_enviado',
        registro_id: venda.id,
        organization_id: venda.organization_id,
        dados_novos: { cliente: clienteData.nome, whatsapp: !!tel, email: !!clienteData.email },
      });
    }

    // ═══════════════════════════════════════════
    // 2. REATIVAÇÃO DE CLIENTES INATIVOS (30+ dias sem compra)
    // ═══════════════════════════════════════════
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: clientesInativos } = await supabase
      .from('vendas')
      .select('cliente_id, organization_id, clientes(nome, telefone, whatsapp, email)')
      .not('cliente_id', 'is', null)
      .order('created_at', { ascending: false });

    const clienteUltimaCompra = new Map<string, any>();
    for (const v of clientesInativos || []) {
      if (v.cliente_id && !clienteUltimaCompra.has(v.cliente_id)) {
        clienteUltimaCompra.set(v.cliente_id, v);
      }
    }

    for (const [clienteId, venda] of clienteUltimaCompra) {
      if (!venda.organization_id) continue;

      const { data: existing } = await supabase
        .from('historico_atividades')
        .select('id')
        .eq('tabela', 'automacao_reativacao')
        .eq('registro_id', clienteId)
        .gte('created_at', thirtyDaysAgo)
        .limit(1);

      if (existing?.length) continue;

      const clienteData = venda.clientes as any;
      if (!clienteData) continue;

      const config = configMap.get(venda.organization_id);
      const tel = clienteData.whatsapp || clienteData.telefone;

      if (tel && config?.whatsapp_instancia) {
        const msg = `Oi, ${clienteData.nome}! 👋\n\nFaz um tempinho que não nos vemos! 😊\n\nTemos muitas *novidades e peças lindas* esperando por você! ✨\n\nQue tal dar uma olhadinha? É só me chamar que te mostro! 💎\n\nSentimos sua falta! 💖`;
        const sent = await sendWhatsApp(tel, msg, config.whatsapp_instancia);
        if (sent) {
          results.reativacao++;
          await supabase.from('historico_atividades').insert({
            tabela: 'automacao_reativacao',
            acao: 'reativacao_enviada',
            registro_id: clienteId,
            organization_id: venda.organization_id,
            dados_novos: { cliente: clienteData.nome },
          });
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // ═══════════════════════════════════════════
    // 3. E-COMMERCE - WhatsApp ao cliente quando pedido é aprovado
    // ═══════════════════════════════════════════
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: pedidosAprovados } = await supabase
      .from('ecommerce_pedidos')
      .select('id, numero_pedido, cliente_nome, cliente_telefone, cliente_email, valor_total, organization_id, status, updated_at')
      .eq('status', 'confirmado')
      .gte('updated_at', oneHourAgo)
      .not('cliente_telefone', 'is', null);

    for (const pedido of pedidosAprovados || []) {
      if (!pedido.organization_id || !pedido.cliente_telefone) continue;

      const { data: existing } = await supabase
        .from('historico_atividades')
        .select('id')
        .eq('tabela', 'automacao_ecommerce_whatsapp')
        .eq('registro_id', pedido.id)
        .limit(1);

      if (existing?.length) continue;

      const config = configMap.get(pedido.organization_id);
      const ecom = ecomMap.get(pedido.organization_id);
      const nomeLoja = ecom?.nome_loja || 'Nossa Loja';

      if (config?.whatsapp_instancia) {
        const valor = Number(pedido.valor_total || 0).toFixed(2);
        const msg = `✅ *Pedido #${pedido.numero_pedido} Confirmado!*\n\nOlá, ${pedido.cliente_nome}!\n\nSeu pedido na *${nomeLoja}* no valor de *R$ ${valor}* foi confirmado com sucesso! 🎉\n\nVocê receberá atualizações sobre o envio. Obrigado pela compra! 💖`;
        const sent = await sendWhatsApp(pedido.cliente_telefone, msg, config.whatsapp_instancia);
        if (sent) results.ecommerce_whatsapp++;

        await supabase.from('historico_atividades').insert({
          tabela: 'automacao_ecommerce_whatsapp',
          acao: 'confirmacao_enviada',
          registro_id: pedido.id,
          organization_id: pedido.organization_id,
          dados_novos: { pedido: pedido.numero_pedido, cliente: pedido.cliente_nome },
        });
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // ═══════════════════════════════════════════
    // 4. ENVIO/RASTREIO - WhatsApp quando envio muda para "enviado"
    // ═══════════════════════════════════════════
    const { data: enviosRecentes } = await supabase
      .from('envios')
      .select('id, destinatario_nome, destinatario_telefone, codigo_rastreio, transportadora, status, organization_id, updated_at')
      .eq('status', 'enviado')
      .gte('updated_at', oneHourAgo)
      .not('destinatario_telefone', 'is', null);

    for (const envio of enviosRecentes || []) {
      if (!envio.organization_id || !envio.destinatario_telefone) continue;

      const { data: existing } = await supabase
        .from('historico_atividades')
        .select('id')
        .eq('tabela', 'automacao_envio_rastreio')
        .eq('registro_id', envio.id)
        .limit(1);

      if (existing?.length) continue;

      const config = configMap.get(envio.organization_id);
      if (config?.whatsapp_instancia) {
        let msg = `📦 *Seu pedido foi enviado!*\n\nOlá, ${envio.destinatario_nome}!\n\nSeu pedido foi despachado! 🎉\n`;
        if (envio.transportadora) msg += `\n🚚 Transportadora: *${envio.transportadora}*`;
        if (envio.codigo_rastreio) msg += `\n📍 Rastreio: *${envio.codigo_rastreio}*`;
        msg += `\n\nAcompanhe sua entrega! Qualquer dúvida, estamos aqui. 😊`;

        const sent = await sendWhatsApp(envio.destinatario_telefone, msg, config.whatsapp_instancia);
        if (sent) results.envio_notificacao++;

        await supabase.from('historico_atividades').insert({
          tabela: 'automacao_envio_rastreio',
          acao: 'rastreio_enviado',
          registro_id: envio.id,
          organization_id: envio.organization_id,
          dados_novos: { destinatario: envio.destinatario_nome, rastreio: envio.codigo_rastreio },
        });
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // ═══════════════════════════════════════════
    // 5. E-COMMERCE - Email quando pedido é enviado (rastreio)
    // ═══════════════════════════════════════════
    const { data: pedidosEnviados } = await supabase
      .from('ecommerce_pedidos')
      .select('id, numero_pedido, cliente_nome, cliente_email, codigo_rastreio, transportadora, organization_id, updated_at')
      .eq('status', 'enviado')
      .gte('updated_at', oneHourAgo)
      .not('cliente_email', 'is', null)
      .not('codigo_rastreio', 'is', null);

    for (const pedido of pedidosEnviados || []) {
      if (!pedido.organization_id || !pedido.cliente_email) continue;

      const { data: existing } = await supabase
        .from('historico_atividades')
        .select('id')
        .eq('tabela', 'automacao_rastreio_email')
        .eq('registro_id', pedido.id)
        .limit(1);

      if (existing?.length) continue;

      const ecom = ecomMap.get(pedido.organization_id);
      const nomeLoja = ecom?.nome_loja || 'Nossa Loja';

      if (brevoKey) {
        const sent = await sendEmailBrevo(
          brevoKey,
          { email: pedido.cliente_email, name: pedido.cliente_nome },
          { email: 'contato@nexsiles.com.br', name: nomeLoja },
          `📦 Pedido #${pedido.numero_pedido} enviado! - ${nomeLoja}`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:#8B5CF6;padding:30px;border-radius:12px 12px 0 0;text-align:center;color:white;">
              <h1 style="margin:0;">📦 Seu Pedido Foi Enviado!</h1>
            </div>
            <div style="padding:30px;background:white;border:1px solid #eee;border-radius:0 0 12px 12px;">
              <p style="font-size:16px;">Olá, <strong>${pedido.cliente_nome}</strong>!</p>
              <p>Seu pedido <strong>#${pedido.numero_pedido}</strong> foi enviado e está a caminho! 🎉</p>
              <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #8B5CF6;">
                ${pedido.transportadora ? `<p style="margin:5px 0;"><strong>🚚 Transportadora:</strong> ${pedido.transportadora}</p>` : ''}
                <p style="margin:5px 0;"><strong>📍 Código de Rastreio:</strong> ${pedido.codigo_rastreio}</p>
              </div>
              <p style="font-size:14px;color:#666;">Acompanhe sua entrega usando o código acima.</p>
            </div>
            <div style="text-align:center;margin-top:20px;color:#999;font-size:12px;">
              <p>${nomeLoja} - © ${new Date().getFullYear()}</p>
            </div>
          </div>`
        );

        if (sent) {
          await supabase.from('historico_atividades').insert({
            tabela: 'automacao_rastreio_email',
            acao: 'rastreio_email_enviado',
            registro_id: pedido.id,
            organization_id: pedido.organization_id,
            dados_novos: { pedido: pedido.numero_pedido, rastreio: pedido.codigo_rastreio },
          });
        }
      }
    }

    console.log('Automações de vendas concluídas:', results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Automacoes-vendas error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
