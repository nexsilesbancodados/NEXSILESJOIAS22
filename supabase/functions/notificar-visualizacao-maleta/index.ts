import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  maleta_id: string;
  visitor_info?: {
    user_agent?: string;
    referrer?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { maleta_id, visitor_info } = await req.json() as RequestBody;

    if (!maleta_id) {
      console.error('maleta_id is required');
      return new Response(
        JSON.stringify({ error: 'maleta_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing view notification for maleta: ${maleta_id}`);

    // Get maleta and revendedora info
    const { data: maleta, error: maletaError } = await supabase
      .from('maletas')
      .select(`
        id,
        nome,
        revendedora_id,
        revendedora:revendedoras(id, nome, user_id)
      `)
      .eq('id', maleta_id)
      .single();

    if (maletaError || !maleta) {
      console.error('Maleta not found:', maletaError);
      return new Response(
        JSON.stringify({ error: 'Maleta not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Maleta found:', maleta.nome);

    // Check if revendedora has a user_id to notify
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const revendedoraData = maleta.revendedora as any;
    const revendedoraUserId = revendedoraData?.user_id as string | null;
    const revendedoraNome = revendedoraData?.nome as string | null;
    
    if (!revendedoraUserId) {
      console.log('No user_id associated with revendedora, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No user to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there was a recent notification (within 5 minutes) to avoid spamming
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentNotification } = await supabase
      .from('notificacoes')
      .select('id')
      .eq('user_id', revendedoraUserId)
      .eq('tipo', 'visualizacao_maleta')
      .ilike('link', `%${maleta_id}%`)
      .gte('created_at', fiveMinutesAgo)
      .maybeSingle();

    if (recentNotification) {
      console.log('Recent notification exists, skipping to avoid spam');
      return new Response(
        JSON.stringify({ success: true, message: 'Recent notification exists' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notification for the revendedora
    const timestamp = new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const { error: notifError } = await supabase
      .from('notificacoes')
      .insert({
        user_id: revendedoraUserId,
        tipo: 'visualizacao_maleta',
        titulo: '👀 Alguém está vendo sua vitrine!',
        mensagem: `Um cliente está visualizando a maleta "${maleta.nome}" às ${timestamp}. Fique atenta, pode haver interesse em breve!`,
        link: `/revendedoras?maleta=${maleta_id}`,
        lida: false,
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Notification created successfully for user:', revendedoraUserId);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
