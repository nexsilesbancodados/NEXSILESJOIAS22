import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    // Find conversations that need follow-up:
    // - Status ativa, no follow-up sent, has client phone
    // - Last contact > 2 hours ago
    // - Lead score is 'quente' or 'morno'
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: conversas, error } = await supabase
      .from('agente_conversas')
      .select('id, organization_id, cliente_nome, cliente_telefone, lead_score, produtos_interesse, session_id')
      .eq('status', 'ativa')
      .eq('follow_up_enviado', false)
      .eq('venda_realizada', false)
      .lt('ultimo_contato_at', twoHoursAgo)
      .in('lead_score', ['quente', 'morno'])
      .limit(50);

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    console.log(`Found ${conversas?.length || 0} conversations for follow-up`);

    let sent = 0;
    let skipped = 0;

    for (const conversa of (conversas || [])) {
      if (!conversa.cliente_telefone) {
        skipped++;
        continue;
      }

      // Get agent config for this organization
      const { data: config } = await supabase
        .from('agente_ia_config')
        .select('nome_agente, whatsapp_instancia')
        .eq('organization_id', conversa.organization_id)
        .maybeSingle();

      const nomeAgente = config?.nome_agente || 'Assistente';
      const produtos = conversa.produtos_interesse || [];
      
      // Build follow-up message
      let mensagem = '';
      if (conversa.lead_score === 'quente') {
        mensagem = `Olá ${conversa.cliente_nome || ''}! 😊 Sou ${nomeAgente}. ` +
          `Vi que você demonstrou interesse em nossos produtos` +
          (produtos.length > 0 ? ` (${produtos.slice(0, 3).join(', ')})` : '') +
          `. Posso ajudar a finalizar seu pedido? Temos condições especiais para você! 💎`;
      } else {
        mensagem = `Oi ${conversa.cliente_nome || ''}! 👋 Aqui é ${nomeAgente}. ` +
          `Lembrei de você! Temos novidades incríveis no nosso catálogo. ` +
          `Quer dar uma olhada? Estou aqui para ajudar! ✨`;
      }

      // Send via Evolution API if configured
      if (evolutionUrl && evolutionKey) {
        let telefone = conversa.cliente_telefone.replace(/\D/g, '');
        if (!telefone.startsWith('55')) telefone = '55' + telefone;

        const instanceName = config?.whatsapp_instancia || 'default';

        try {
          const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify({
              number: telefone,
              text: mensagem,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error(`WhatsApp send error for ${conversa.id}:`, response.status, errText);
            continue;
          }
          await response.json();
        } catch (e) {
          console.error(`Error sending follow-up for ${conversa.id}:`, e);
          continue;
        }
      }

      // Mark as follow-up sent
      await supabase
        .from('agente_conversas')
        .update({
          follow_up_enviado: true,
          follow_up_at: new Date().toISOString(),
        })
        .eq('id', conversa.id);

      sent++;
    }

    console.log(`Follow-up complete: ${sent} sent, ${skipped} skipped`);

    return new Response(JSON.stringify({ success: true, sent, skipped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Follow-up error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
