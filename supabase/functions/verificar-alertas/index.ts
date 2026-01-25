import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertConfig {
  estoque_minimo: number;
  dias_maleta_vencendo: number;
  dias_romaneio_pendente: number;
}

const defaultConfig: AlertConfig = {
  estoque_minimo: 5,
  dias_maleta_vencendo: 3,
  dias_romaneio_pendente: 7,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const alertsCreated: string[] = [];
    const today = new Date();

    console.log('Iniciando verificação de alertas...');

    // 1. Check low stock pieces (sem filtro por user_id - tabela não tem essa coluna)
    const { data: lowStockPieces, error: lowStockError } = await supabase
      .from('pecas')
      .select('id, nome, codigo, estoque, estoque_minimo')
      .eq('ativo', true);

    if (lowStockError) {
      console.error('Erro ao buscar peças:', lowStockError);
    } else {
      console.log(`Encontradas ${lowStockPieces?.length || 0} peças ativas`);
      
      for (const peca of lowStockPieces || []) {
        const minimo = peca.estoque_minimo || defaultConfig.estoque_minimo;
        const estoqueAtual = peca.estoque || 0;
        
        if (estoqueAtual <= minimo) {
          // Check if notification already exists for today
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          
          const { data: existingNotif } = await supabase
            .from('notificacoes')
            .select('id')
            .eq('tipo', 'estoque_baixo')
            .ilike('mensagem', `%${peca.nome}%`)
            .gte('created_at', todayStart.toISOString())
            .limit(1);

          if (!existingNotif?.length) {
            const { error: insertError } = await supabase.from('notificacoes').insert({
              titulo: 'Estoque Baixo',
              mensagem: `A peça "${peca.nome}" (${peca.codigo || 'S/C'}) está com apenas ${estoqueAtual} unidades em estoque.`,
              tipo: 'estoque_baixo',
              link: '/pecas'
            });
            
            if (!insertError) {
              alertsCreated.push(`Estoque baixo: ${peca.nome} (${estoqueAtual}/${minimo})`);
              console.log(`Alerta criado: Estoque baixo - ${peca.nome}`);
            }
          }
        }
      }
    }

    // 2. Check customer birthdays (sem filtro por user_id)
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome, data_nascimento, telefone, whatsapp')
      .eq('ativo', true)
      .not('data_nascimento', 'is', null);

    if (clientesError) {
      console.error('Erro ao buscar clientes:', clientesError);
    } else {
      console.log(`Encontrados ${clientes?.length || 0} clientes com data de nascimento`);
      
      const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      for (const cliente of clientes || []) {
        if (cliente.data_nascimento) {
          const birthDate = new Date(cliente.data_nascimento);
          const birthMonthDay = `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
          
          if (birthMonthDay === todayMonthDay) {
            const todayStart = new Date(today);
            todayStart.setHours(0, 0, 0, 0);
            
            const { data: existingNotif } = await supabase
              .from('notificacoes')
              .select('id')
              .eq('tipo', 'aniversario')
              .ilike('mensagem', `%${cliente.nome}%`)
              .gte('created_at', todayStart.toISOString())
              .limit(1);

            if (!existingNotif?.length) {
              const { error: insertError } = await supabase.from('notificacoes').insert({
                titulo: '🎂 Aniversário de Cliente',
                mensagem: `Hoje é aniversário de ${cliente.nome}! Que tal enviar uma mensagem especial?`,
                tipo: 'aniversario',
                link: '/clientes'
              });
              
              if (!insertError) {
                alertsCreated.push(`Aniversário: ${cliente.nome}`);
                console.log(`Alerta criado: Aniversário - ${cliente.nome}`);
              }
            }
          }
        }
      }
    }

    // 3. Check expiring briefcases (maletas vencendo)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + defaultConfig.dias_maleta_vencendo);
    
    const { data: maletas, error: maletasError } = await supabase
      .from('maletas')
      .select(`
        id, 
        codigo, 
        nome,
        data_devolucao, 
        revendedora_id,
        revendedoras (nome)
      `)
      .eq('status', 'emprestada')
      .not('data_devolucao', 'is', null)
      .lte('data_devolucao', futureDate.toISOString().split('T')[0])
      .gte('data_devolucao', today.toISOString().split('T')[0]);

    if (maletasError) {
      console.error('Erro ao buscar maletas:', maletasError);
    } else {
      console.log(`Encontradas ${maletas?.length || 0} maletas vencendo`);
      
      for (const maleta of maletas || []) {
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        const { data: existingNotif } = await supabase
          .from('notificacoes')
          .select('id')
          .eq('tipo', 'maleta_vencendo')
          .ilike('mensagem', `%${maleta.codigo || maleta.nome}%`)
          .gte('created_at', todayStart.toISOString())
          .limit(1);

        if (!existingNotif?.length) {
          const revendedoraNome = (maleta.revendedoras as any)?.nome || 'Revendedora';
          const diasRestantes = Math.ceil(
            (new Date(maleta.data_devolucao!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          const { error: insertError } = await supabase.from('notificacoes').insert({
            titulo: '📦 Maleta Vencendo',
            mensagem: `A maleta ${maleta.codigo || maleta.nome} com ${revendedoraNome} vence em ${diasRestantes} dia(s).`,
            tipo: 'maleta_vencendo',
            link: '/revendedoras'
          });
          
          if (!insertError) {
            alertsCreated.push(`Maleta vencendo: ${maleta.codigo || maleta.nome} (${diasRestantes} dias)`);
            console.log(`Alerta criado: Maleta vencendo - ${maleta.codigo || maleta.nome}`);
          }
        }
      }
    }

    // 4. Check pending romaneios (romaneios pendentes)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - defaultConfig.dias_romaneio_pendente);
    
    const { data: romaneios, error: romaneiosError } = await supabase
      .from('romaneios')
      .select(`
        id, 
        numero,
        revendedora_id,
        revendedoras (nome)
      `)
      .eq('status', 'pendente')
      .lte('created_at', oldDate.toISOString());

    if (romaneiosError) {
      console.error('Erro ao buscar romaneios:', romaneiosError);
    } else {
      console.log(`Encontrados ${romaneios?.length || 0} romaneios pendentes`);
      
      for (const romaneio of romaneios || []) {
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        const { data: existingNotif } = await supabase
          .from('notificacoes')
          .select('id')
          .eq('tipo', 'romaneio_pendente')
          .ilike('mensagem', `%${romaneio.numero}%`)
          .gte('created_at', todayStart.toISOString())
          .limit(1);

        if (!existingNotif?.length) {
          const revendedoraNome = (romaneio.revendedoras as any)?.nome || 'revendedora';
          
          const { error: insertError } = await supabase.from('notificacoes').insert({
            titulo: '📋 Romaneio Pendente',
            mensagem: `O romaneio ${romaneio.numero} de ${revendedoraNome} está pendente há mais de ${defaultConfig.dias_romaneio_pendente} dias.`,
            tipo: 'romaneio_pendente',
            link: '/romaneios'
          });
          
          if (!insertError) {
            alertsCreated.push(`Romaneio pendente: ${romaneio.numero}`);
            console.log(`Alerta criado: Romaneio pendente - ${romaneio.numero}`);
          }
        }
      }
    }

    // 5. Check revendedoras birthdays
    const { data: revendedoras, error: revendedorasError } = await supabase
      .from('revendedoras')
      .select('id, nome, data_nascimento, telefone, whatsapp')
      .eq('ativo', true)
      .not('data_nascimento', 'is', null);

    if (revendedorasError) {
      console.error('Erro ao buscar revendedoras:', revendedorasError);
    } else {
      console.log(`Encontradas ${revendedoras?.length || 0} revendedoras com data de nascimento`);
      
      const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      for (const revendedora of revendedoras || []) {
        if (revendedora.data_nascimento) {
          const birthDate = new Date(revendedora.data_nascimento);
          const birthMonthDay = `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
          
          if (birthMonthDay === todayMonthDay) {
            const todayStart = new Date(today);
            todayStart.setHours(0, 0, 0, 0);
            
            const { data: existingNotif } = await supabase
              .from('notificacoes')
              .select('id')
              .eq('tipo', 'aniversario')
              .ilike('mensagem', `%${revendedora.nome}%`)
              .gte('created_at', todayStart.toISOString())
              .limit(1);

            if (!existingNotif?.length) {
              const { error: insertError } = await supabase.from('notificacoes').insert({
                titulo: '🎉 Aniversário de Revendedora',
                mensagem: `Hoje é aniversário de ${revendedora.nome}! Envie os parabéns!`,
                tipo: 'aniversario',
                link: '/revendedoras'
              });
              
              if (!insertError) {
                alertsCreated.push(`Aniversário: ${revendedora.nome} (revendedora)`);
                console.log(`Alerta criado: Aniversário - ${revendedora.nome}`);
              }
            }
          }
        }
      }
    }

    console.log(`Verificação concluída. ${alertsCreated.length} alertas criados.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated: alertsCreated.length,
        details: alertsCreated,
        timestamp: new Date().toISOString()
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
