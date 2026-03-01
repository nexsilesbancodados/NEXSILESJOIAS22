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

    const now = new Date();
    const lembretesSent: string[] = [];

    // Fetch agendamentos that need reminders
    // Get all agendamentos where:
    // - status is 'agendado' or 'confirmado'
    // - lembrete_enviado is false or null
    // - data_hora is in the future but within lembrete_horas_antes hours
    // First get agendamentos
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('*')
      .in('status', ['agendado', 'confirmado'])
      .or('lembrete_enviado.is.null,lembrete_enviado.eq.false')
      .gt('data_hora', now.toISOString());

    // Build a map of org_id -> whatsapp_instancia
    const orgIds = [...new Set((agendamentos || []).map((a: any) => a.organization_id).filter(Boolean))];
    const configMap: Record<string, string> = {};
    if (orgIds.length > 0) {
      const { data: configs } = await supabase
        .from('agente_ia_config')
        .select('organization_id, whatsapp_instancia')
        .in('organization_id', orgIds);
      for (const c of configs || []) {
        if (c.whatsapp_instancia) configMap[c.organization_id] = c.whatsapp_instancia;
      }
    }

    if (error) {
      console.error('Error fetching agendamentos:', error);
      throw error;
    }

    if (!agendamentos || agendamentos.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum lembrete pendente', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    for (const agendamento of agendamentos) {
      const horasAntes = agendamento.lembrete_horas_antes || 2;
      const dataHora = new Date(agendamento.data_hora);
      const diffHours = (dataHora.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Only send if within the reminder window
      if (diffHours > horasAntes || diffHours < 0) {
        continue;
      }

      const telefone = agendamento.cliente_telefone;
      if (!telefone) {
        console.log(`Agendamento ${agendamento.id}: sem telefone, pulando`);
        continue;
      }

      const dataFormatada = dataHora.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const horaFormatada = dataHora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const mensagem = `📅 *Lembrete de Agendamento*\n\nOlá, ${agendamento.cliente_nome}!\n\nEste é um lembrete do seu agendamento:\n\n📌 *${agendamento.titulo}*\n🗓️ ${dataFormatada}\n⏰ ${horaFormatada}\n${agendamento.duracao_minutos ? `⏱️ Duração: ${agendamento.duracao_minutos} minutos` : ''}\n${agendamento.descricao ? `📝 ${agendamento.descricao}` : ''}\n\nAguardamos você! 😊`;

      let sent = false;

      // Try sending via Evolution API
      if (evolutionUrl && evolutionKey) {
        try {
          let tel = telefone.replace(/\D/g, '');
          if (!tel.startsWith('55')) tel = '55' + tel;

          const instanceName = configMap[agendamento.organization_id] || 'default';

          const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey
            },
            body: JSON.stringify({
              number: tel,
              text: mensagem
            })
          });

          if (response.ok) {
            sent = true;
            console.log(`Lembrete enviado para ${agendamento.cliente_nome} (${telefone})`);
          } else {
            console.error(`Erro ao enviar lembrete via WhatsApp: ${response.status}`);
          }
        } catch (e) {
          console.error('Evolution API error:', e);
        }
      }

      // Try sending via email if Resend is configured
      if (!sent && agendamento.cliente_email) {
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`
              },
              body: JSON.stringify({
                from: 'NexSiles <contato@nexsiles.com.br>',
                to: agendamento.cliente_email,
                subject: `📅 Lembrete: ${agendamento.titulo} - ${dataFormatada}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333;">📅 Lembrete de Agendamento</h1>
                    <p>Olá, <strong>${agendamento.cliente_nome}</strong>!</p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9b87f5;">
                      <h2 style="margin: 0 0 10px;">${agendamento.titulo}</h2>
                      <p style="margin: 5px 0;">🗓️ <strong>${dataFormatada}</strong></p>
                      <p style="margin: 5px 0;">⏰ <strong>${horaFormatada}</strong></p>
                      ${agendamento.duracao_minutos ? `<p style="margin: 5px 0;">⏱️ Duração: ${agendamento.duracao_minutos} minutos</p>` : ''}
                      ${agendamento.descricao ? `<p style="margin: 5px 0;">📝 ${agendamento.descricao}</p>` : ''}
                    </div>
                    <p>Aguardamos você! 😊</p>
                  </div>
                `
              })
            });

            if (emailResponse.ok) {
              sent = true;
              console.log(`Lembrete enviado por email para ${agendamento.cliente_email}`);
            }
          } catch (e) {
            console.error('Resend error:', e);
          }
        }
      }

      // Mark reminder as sent
      if (sent) {
        await supabase
          .from('agendamentos')
          .update({ lembrete_enviado: true })
          .eq('id', agendamento.id);
        
        lembretesSent.push(agendamento.id);
      }
    }

    return new Response(JSON.stringify({ 
      message: `${lembretesSent.length} lembrete(s) enviado(s)`,
      count: lembretesSent.length,
      ids: lembretesSent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
