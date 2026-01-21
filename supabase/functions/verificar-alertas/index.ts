import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertConfig {
  estoque_minimo: number;
  dias_maleta_vencendo: number;
  dias_romaneio_pendente: number;
  percentual_meta: number;
}

const defaultConfig: AlertConfig = {
  estoque_minimo: 5,
  dias_maleta_vencendo: 3,
  dias_romaneio_pendente: 7,
  percentual_meta: 80,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users to check alerts for each
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, nome')
      .eq('ativo', true);

    if (profilesError) throw profilesError;

    const alertsCreated: string[] = [];
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    for (const profile of profiles || []) {
      const userId = profile.user_id;

      // 1. Check low stock pieces
      const { data: lowStockPieces } = await supabase
        .from('pecas')
        .select('id, nome, estoque, estoque_minimo')
        .eq('user_id', userId)
        .eq('ativo', true)
        .or(`estoque.lte.${defaultConfig.estoque_minimo},estoque.lte.estoque_minimo`);

      for (const peca of lowStockPieces || []) {
        const minimo = peca.estoque_minimo || defaultConfig.estoque_minimo;
        if ((peca.estoque || 0) <= minimo) {
          // Check if notification already exists for today
          const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
          const { data: existingNotif } = await supabase
            .from('notificacoes')
            .select('id')
            .eq('user_id', userId)
            .eq('tipo', 'estoque_baixo')
            .eq('entidade_id', peca.id)
            .gte('created_at', todayStart)
            .limit(1);

          if (!existingNotif?.length) {
            await supabase.from('notificacoes').insert({
              user_id: userId,
              titulo: 'Estoque Baixo',
              mensagem: `A peça "${peca.nome}" está com apenas ${peca.estoque} unidades em estoque.`,
              tipo: 'estoque_baixo',
              entidade_tipo: 'peca',
              entidade_id: peca.id,
              dados: { estoque: peca.estoque, minimo }
            });
            alertsCreated.push(`Estoque baixo: ${peca.nome}`);
          }
        }
      }

      // 2. Check customer birthdays
      const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const { data: birthdayClients } = await supabase
        .from('clientes')
        .select('id, nome, data_nascimento')
        .eq('user_id', userId)
        .not('data_nascimento', 'is', null);

      for (const cliente of birthdayClients || []) {
        if (cliente.data_nascimento) {
          const birthDate = new Date(cliente.data_nascimento);
          const birthMonthDay = `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
          
          if (birthMonthDay === todayMonthDay) {
            const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const { data: existingNotif } = await supabase
              .from('notificacoes')
              .select('id')
              .eq('user_id', userId)
              .eq('tipo', 'aniversario')
              .eq('entidade_id', cliente.id)
              .gte('created_at', todayStart)
              .limit(1);

            if (!existingNotif?.length) {
              await supabase.from('notificacoes').insert({
                user_id: userId,
                titulo: 'Aniversário de Cliente',
                mensagem: `Hoje é aniversário de ${cliente.nome}! Que tal enviar uma mensagem especial?`,
                tipo: 'aniversario',
                entidade_tipo: 'cliente',
                entidade_id: cliente.id,
                dados: { nome: cliente.nome }
              });
              alertsCreated.push(`Aniversário: ${cliente.nome}`);
            }
          }
        }
      }

      // 3. Check expiring briefcases (maletas)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + defaultConfig.dias_maleta_vencendo);
      
      const { data: expiringMaletas } = await supabase
        .from('maletas')
        .select('id, codigo, data_devolucao_prevista, revendedora_id, revendedoras(nome)')
        .eq('user_id', userId)
        .eq('status', 'emprestada')
        .lte('data_devolucao_prevista', futureDate.toISOString().split('T')[0])
        .gte('data_devolucao_prevista', today.toISOString().split('T')[0]);

      for (const maleta of expiringMaletas || []) {
        const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const { data: existingNotif } = await supabase
          .from('notificacoes')
          .select('id')
          .eq('user_id', userId)
          .eq('tipo', 'maleta_vencendo')
          .eq('entidade_id', maleta.id)
          .gte('created_at', todayStart)
          .limit(1);

        if (!existingNotif?.length) {
          const revendedoraNome = (maleta.revendedoras as any)?.nome || 'Revendedora';
          const diasRestantes = Math.ceil(
            (new Date(maleta.data_devolucao_prevista!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          await supabase.from('notificacoes').insert({
            user_id: userId,
            titulo: 'Maleta Vencendo',
            mensagem: `A maleta ${maleta.codigo} com ${revendedoraNome} vence em ${diasRestantes} dia(s).`,
            tipo: 'maleta_vencendo',
            entidade_tipo: 'maleta',
            entidade_id: maleta.id,
            dados: { codigo: maleta.codigo, dias_restantes: diasRestantes, revendedora: revendedoraNome }
          });
          alertsCreated.push(`Maleta vencendo: ${maleta.codigo}`);
        }
      }

      // 4. Check monthly goals progress
      const { data: metas } = await supabase
        .from('metas')
        .select('id, valor, tipo')
        .eq('user_id', userId)
        .eq('mes', currentMonth)
        .eq('ano', currentYear);

      // Get total sales for current month
      const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const monthEnd = new Date(currentYear, currentMonth, 0).toISOString();
      
      const { data: vendas } = await supabase
        .from('vendas')
        .select('total')
        .eq('user_id', userId)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      const totalVendas = vendas?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;

      for (const meta of metas || []) {
        if (meta.valor && meta.valor > 0) {
          const percentual = (totalVendas / meta.valor) * 100;
          
          if (percentual >= defaultConfig.percentual_meta && percentual < 100) {
            const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const { data: existingNotif } = await supabase
              .from('notificacoes')
              .select('id')
              .eq('user_id', userId)
              .eq('tipo', 'meta_proxima')
              .eq('entidade_id', meta.id)
              .gte('created_at', todayStart)
              .limit(1);

            if (!existingNotif?.length) {
              await supabase.from('notificacoes').insert({
                user_id: userId,
                titulo: 'Meta Quase Atingida!',
                mensagem: `Você já atingiu ${percentual.toFixed(1)}% da sua meta de vendas. Faltam R$ ${(meta.valor - totalVendas).toFixed(2)}!`,
                tipo: 'meta_proxima',
                entidade_tipo: 'meta',
                entidade_id: meta.id,
                dados: { percentual: percentual.toFixed(1), faltando: meta.valor - totalVendas }
              });
              alertsCreated.push(`Meta próxima: ${percentual.toFixed(1)}%`);
            }
          }
        }
      }

      // 5. Check pending romaneios
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - defaultConfig.dias_romaneio_pendente);
      
      const { data: pendingRomaneios } = await supabase
        .from('romaneios')
        .select('id, data, reseller_nome, total')
        .eq('user_id', userId)
        .eq('status', 'pendente')
        .lte('created_at', oldDate.toISOString());

      for (const romaneio of pendingRomaneios || []) {
        const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const { data: existingNotif } = await supabase
          .from('notificacoes')
          .select('id')
          .eq('user_id', userId)
          .eq('tipo', 'romaneio_pendente')
          .eq('entidade_id', romaneio.id)
          .gte('created_at', todayStart)
          .limit(1);

        if (!existingNotif?.length) {
          await supabase.from('notificacoes').insert({
            user_id: userId,
            titulo: 'Romaneio Pendente',
            mensagem: `O romaneio de ${romaneio.reseller_nome || 'revendedora'} está pendente há mais de ${defaultConfig.dias_romaneio_pendente} dias.`,
            tipo: 'romaneio_pendente',
            entidade_tipo: 'romaneio',
            entidade_id: romaneio.id,
            dados: { total: romaneio.total, revendedora: romaneio.reseller_nome }
          });
          alertsCreated.push(`Romaneio pendente: ${romaneio.reseller_nome}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated: alertsCreated.length,
        details: alertsCreated 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking alerts:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
