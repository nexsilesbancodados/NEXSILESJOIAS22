import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function sendWhatsAppMessage(phone: string, message: string, instanceName: string): Promise<{ success: boolean; error?: string }> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionUrl || !evolutionKey) {
    return { success: false, error: 'Evolution API not configured' };
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evolutionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: fullPhone,
        text: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's organization
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', userId)
      .single();

    if (!membership?.organization_id) {
      return new Response(JSON.stringify({ error: 'No organization found' }), { status: 400, headers: corsHeaders });
    }

    const organizationId = membership.organization_id;

    const body = await req.json();
    const { mensagem, filtro, contatos_manuais } = body;
    // filtro: 'todos' | 'quente' | 'morno' | 'frio' | 'sem_venda' | 'com_venda' | 'manual'
    // contatos_manuais: string[] (phone numbers for manual mode)

    if (!mensagem) {
      return new Response(JSON.stringify({ error: 'Mensagem é obrigatória' }), { status: 400, headers: corsHeaders });
    }

    // Get agent config for instance name
    const { data: config } = await supabase
      .from('agente_ia_config')
      .select('whatsapp_instancia')
      .eq('organization_id', organizationId)
      .single();

    const instanceName = config?.whatsapp_instancia;
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'WhatsApp não conectado. Conecte primeiro nas configurações.' }), { status: 400, headers: corsHeaders });
    }

    // Get target contacts based on filter
    let telefones: string[] = [];

    if (filtro === 'manual' && contatos_manuais?.length) {
      telefones = contatos_manuais;
    } else {
      let query = supabase
        .from('agente_conversas')
        .select('cliente_telefone, lead_score, venda_realizada')
        .eq('organization_id', organizationId)
        .not('cliente_telefone', 'is', null);

      if (filtro === 'quente') {
        query = query.eq('lead_score', 'quente');
      } else if (filtro === 'morno') {
        query = query.eq('lead_score', 'morno');
      } else if (filtro === 'frio') {
        query = query.eq('lead_score', 'frio');
      } else if (filtro === 'sem_venda') {
        query = query.eq('venda_realizada', false);
      } else if (filtro === 'com_venda') {
        query = query.eq('venda_realizada', true);
      }

      const { data: conversas } = await query;
      
      // Deduplicate phone numbers
      const phoneSet = new Set<string>();
      for (const c of conversas || []) {
        if (c.cliente_telefone) {
          const clean = c.cliente_telefone.replace(/\D/g, '');
          if (clean.length >= 10) phoneSet.add(clean);
        }
      }
      telefones = Array.from(phoneSet);
    }

    if (telefones.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum contato encontrado para este filtro' }), { status: 400, headers: corsHeaders });
    }

    // Rate limit: max 200 contacts per broadcast
    if (telefones.length > 200) {
      telefones = telefones.slice(0, 200);
    }

    console.log(`Broadcasting to ${telefones.length} contacts for org ${organizationId}`);

    // Send messages with delay to avoid rate limiting
    let enviados = 0;
    let erros = 0;
    const detalhes: { telefone: string; status: string; erro?: string }[] = [];

    for (const tel of telefones) {
      const result = await sendWhatsAppMessage(tel, mensagem, instanceName);
      
      if (result.success) {
        enviados++;
        detalhes.push({ telefone: tel, status: 'enviado' });
      } else {
        erros++;
        detalhes.push({ telefone: tel, status: 'erro', erro: result.error });
      }

      // 1.5s delay between messages to avoid API rate limiting
      if (telefones.indexOf(tel) < telefones.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Log broadcast activity
    await supabase.from('historico_atividades').insert({
      tabela: 'broadcast',
      acao: 'envio_massa',
      organization_id: organizationId,
      user_id: userId,
      dados_novos: {
        filtro,
        total_contatos: telefones.length,
        enviados,
        erros,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      total: telefones.length,
      enviados,
      erros,
      detalhes: detalhes.slice(0, 20) // Return first 20 details only
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
