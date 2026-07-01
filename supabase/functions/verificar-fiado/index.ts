import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireCronSecret } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const hoje = new Date().toISOString().split('T')[0];

    // Marcar como vencido os fiados que passaram da data sem estar pagos
    await supabaseAdmin
      .from('fiado')
      .update({ status: 'vencido' })
      .eq('status', 'aberto')
      .lt('data_vencimento', hoje);

    // Buscar fiados vencidos que ainda não receberam notificação
    const { data: fiados, error } = await supabaseAdmin
      .from('fiado')
      .select('*, clientes(nome, telefone, whatsapp), organizations:organization_id(name)')
      .in('status', ['aberto', 'vencido'])
      .lte('data_vencimento', hoje)
      .eq('notificacao_enviada', false)
      .limit(50);

    if (error) throw error;

    let enviados = 0;

    for (const fiado of fiados || []) {
      const tel = fiado.clientes?.whatsapp || fiado.clientes?.telefone;
      if (!tel) continue;

      // Tentar enviar via Evolution API se configurado
      const { data: config } = await supabaseAdmin
        .from('agente_ia_config')
        .select('whatsapp_instancia, whatsapp_numero')
        .eq('organization_id', fiado.organization_id)
        .maybeSingle();

      if (config?.whatsapp_instancia) {
        const restante = fiado.valor_total - fiado.valor_pago;
        const vencimento = new Date(fiado.data_vencimento).toLocaleDateString('pt-BR');
        const msg = `Olá ${fiado.clientes?.nome}! 👋\n\nPassamos para lembrar que você tem um valor de *R$ ${restante.toFixed(2)}* em aberto com vencimento em *${vencimento}*.\n\nPor favor, entre em contato para regularizar. Obrigado! 🙏`;

        const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
        const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

        if (evolutionApiUrl && evolutionApiKey) {
          try {
            const numeroLimpo = tel.replace(/\D/g, '');
            await fetch(`${evolutionApiUrl}/message/sendText/${config.whatsapp_instancia}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: evolutionApiKey,
              },
              body: JSON.stringify({
                number: `55${numeroLimpo}`,
                text: msg,
              }),
            });

            await supabaseAdmin
              .from('fiado')
              .update({ notificacao_enviada: true, notificacao_enviada_at: new Date().toISOString() })
              .eq('id', fiado.id);

            enviados++;
          } catch (err) {
            console.error('Erro ao enviar WhatsApp para fiado:', fiado.id, err);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, fiados_verificados: fiados?.length || 0, notificacoes_enviadas: enviados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
