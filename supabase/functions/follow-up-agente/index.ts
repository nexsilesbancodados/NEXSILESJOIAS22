import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireCronSecret } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multi-stage follow-up messages
const followUpStages = {
  // Stage 1: 30 minutes - soft nudge
  stage1: {
    minMinutes: 30,
    maxMinutes: 120,
    quente: (nome: string, _agente: string, produtos: string[]) => 
      `Oi ${nome}! 😊 Vi que você estava olhando ${produtos.length > 0 ? produtos.slice(0, 2).join(' e ') : 'nossas peças'}. Ainda está interessado(a)? Posso te ajudar a escolher! 💎`,
    morno: (nome: string, _agente: string, _produtos: string[]) =>
      `Oi ${nome}! 👋 Lembrei de você! Vi que estava dando uma olhada nos nossos produtos. Quer que eu te envie nosso catálogo? Tem muita coisa linda! ✨`,
  },
  // Stage 2: 2 hours - urgency
  stage2: {
    minMinutes: 120,
    maxMinutes: 1440,
    quente: (nome: string, _agente: string, produtos: string[]) =>
      `${nome}, aquela peça que você gostou ${produtos.length > 0 ? `(${produtos[0]})` : ''} está com poucas unidades! 🔥 Quer que eu separe para você antes que acabe? É só confirmar! 😊`,
    morno: (nome: string, _agente: string, _produtos: string[]) =>
      `Oi ${nome}! 💫 Passando para avisar que temos novidades no catálogo! Se quiser dar uma olhada, é só me chamar. Estou aqui pra te ajudar! 😉`,
  },
  // Stage 3: 24 hours - last attempt
  stage3: {
    minMinutes: 1440,
    maxMinutes: 4320,
    quente: (nome: string, _agente: string, _produtos: string[]) =>
      `${nome}, última chamada! 🎯 Preparei uma seleção especial pra você baseada no que você gostou. Quer ver? É rapidinho! 💎`,
    morno: (nome: string, _agente: string, _produtos: string[]) =>
      `Oi ${nome}! 👋 Faz um tempinho que não nos falamos. Temos peças novas que acho que você vai amar! Me chama quando quiser conferir. 🌟`,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    // Get all active conversations that haven't been sold and have phone
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: conversas, error } = await supabase
      .from('agente_conversas')
      .select('id, organization_id, cliente_nome, cliente_telefone, lead_score, produtos_interesse, session_id, follow_up_enviado, follow_up_at, ultimo_contato_at')
      .eq('status', 'ativa')
      .eq('venda_realizada', false)
      .lt('ultimo_contato_at', thirtyMinutesAgo)
      .gte('ultimo_contato_at', threeDaysAgo)
      .in('lead_score', ['quente', 'morno'])
      .not('cliente_telefone', 'is', null)
      .limit(100);

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    console.log(`Found ${conversas?.length || 0} conversations to check for follow-up`);

    let sent = 0;
    let skipped = 0;

    for (const conversa of (conversas || [])) {
      if (!conversa.cliente_telefone) {
        skipped++;
        continue;
      }

      // Determine which stage to send
      const lastContact = new Date(conversa.ultimo_contato_at);
      const minutesSinceContact = (Date.now() - lastContact.getTime()) / (1000 * 60);
      const lastFollowUp = conversa.follow_up_at ? new Date(conversa.follow_up_at) : null;
      const minutesSinceFollowUp = lastFollowUp ? (Date.now() - lastFollowUp.getTime()) / (1000 * 60) : Infinity;

      let stage: keyof typeof followUpStages | null = null;

      if (!conversa.follow_up_enviado) {
        // Never sent follow-up → stage 1 (after 30min)
        if (minutesSinceContact >= followUpStages.stage1.minMinutes) {
          stage = 'stage1';
        }
      } else if (lastFollowUp) {
        // Already sent at least one follow-up
        if (minutesSinceFollowUp >= 90 && minutesSinceContact >= followUpStages.stage2.minMinutes && minutesSinceContact < followUpStages.stage2.maxMinutes) {
          // Check if we already sent stage 2
          const minutesSinceFirst = lastFollowUp ? (Date.now() - lastFollowUp.getTime()) / (1000 * 60) : 0;
          if (minutesSinceFirst < followUpStages.stage2.minMinutes) {
            stage = 'stage2';
          }
        }
        if (minutesSinceContact >= followUpStages.stage3.minMinutes && minutesSinceContact < followUpStages.stage3.maxMinutes && minutesSinceFollowUp >= 720) {
          stage = 'stage3';
        }
      }

      if (!stage) {
        skipped++;
        continue;
      }

      // Skip if client replied AFTER our last follow-up (they're engaged, wait for agent response)
      if (conversa.follow_up_at && conversa.ultimo_contato_at) {
        const lastContactTime = new Date(conversa.ultimo_contato_at).getTime();
        const lastFollowUpTime = new Date(conversa.follow_up_at).getTime();
        if (lastContactTime > lastFollowUpTime) {
          skipped++;
          continue;
        }
      }

      // Get agent config for this organization
      const { data: config } = await supabase
        .from('agente_ia_config')
        .select('nome_agente, whatsapp_instancia')
        .eq('organization_id', conversa.organization_id)
        .maybeSingle();

      const nomeAgente = config?.nome_agente || 'Assistente';
      const produtos = conversa.produtos_interesse || [];
      const leadType = conversa.lead_score as 'quente' | 'morno';
      
      // Build stage-specific message
      const stageConfig = followUpStages[stage];
      const mensagem = stageConfig[leadType](conversa.cliente_nome || '', nomeAgente, produtos);

      console.log(`Sending ${stage} follow-up to ${conversa.cliente_telefone} (${leadType}): ${mensagem.substring(0, 50)}...`);

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

      // Mark follow-up
      await supabase
        .from('agente_conversas')
        .update({
          follow_up_enviado: true,
          follow_up_at: new Date().toISOString(),
        })
        .eq('id', conversa.id);

      // If stage 3 sent, close the conversation
      if (stage === 'stage3') {
        await supabase
          .from('agente_conversas')
          .update({ status: 'finalizada', closed_at: new Date().toISOString() })
          .eq('id', conversa.id);
      }

      sent++;
      
      // Small delay between sends to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
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
