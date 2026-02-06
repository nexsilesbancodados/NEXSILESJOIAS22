import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RelatorioRequest {
  tipo: 'vendas' | 'estoque' | 'revendedoras' | 'clientes' | 'maletas';
  dataInicio?: string;
  dataFim?: string;
  formato?: 'json' | 'csv';
}

interface VendaItem {
  id: string;
  numero: string | null;
  data_venda: string | null;
  valor_total: number;
  forma_pagamento: string | null;
  status: string | null;
  cliente_nome?: string;
  revendedora_nome?: string;
}

interface PecaItem {
  id: string;
  codigo: string | null;
  nome: string;
  categoria: string | null;
  preco_venda: number | null;
  preco_custo: number | null;
  estoque: number | null;
  estoque_minimo: number | null;
}

// Helper to validate authentication
async function validateAuth(req: Request): Promise<{ user: any; organizationId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    return null;
  }

  // Get user's organization
  const { data: membership } = await supabaseClient
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    return null;
  }

  return { user, organizationId: membership.organization_id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const auth = await validateAuth(req);
    if (!auth) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado. Faça login para continuar.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role but filter by organization
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RelatorioRequest = await req.json();
    const { tipo, dataInicio, dataFim, formato = 'json' } = body;

    console.log(`Gerando relatório: ${tipo} para org: ${auth.organizationId}`, { dataInicio, dataFim, formato });

    let data: any[] = [];
    let resumo: any = {};

    switch (tipo) {
      case 'vendas': {
        let query = supabase
          .from('vendas')
          .select(`
            id,
            numero,
            data_venda,
            valor_total,
            subtotal,
            desconto,
            forma_pagamento,
            status,
            clientes (nome),
            revendedoras (nome)
          `)
          .eq('organization_id', auth.organizationId)
          .order('data_venda', { ascending: false });

        if (dataInicio) {
          query = query.gte('data_venda', dataInicio);
        }
        if (dataFim) {
          query = query.lte('data_venda', dataFim);
        }

        const { data: vendas, error } = await query;
        
        if (error) throw error;

        data = (vendas || []).map((v: any) => ({
          id: v.id,
          numero: v.numero,
          data_venda: v.data_venda,
          valor_total: v.valor_total,
          subtotal: v.subtotal,
          desconto: v.desconto,
          forma_pagamento: v.forma_pagamento,
          status: v.status,
          cliente_nome: v.clientes?.nome || '-',
          revendedora_nome: v.revendedoras?.nome || '-'
        }));

        const totalVendas = data.reduce((acc, v) => acc + (v.valor_total || 0), 0);
        const totalDescontos = data.reduce((acc, v) => acc + (v.desconto || 0), 0);
        
        resumo = {
          total_registros: data.length,
          valor_total: totalVendas,
          total_descontos: totalDescontos,
          ticket_medio: data.length > 0 ? totalVendas / data.length : 0,
          por_forma_pagamento: data.reduce((acc: any, v) => {
            const forma = v.forma_pagamento || 'Não informado';
            acc[forma] = (acc[forma] || 0) + (v.valor_total || 0);
            return acc;
          }, {}),
          por_status: data.reduce((acc: any, v) => {
            const status = v.status || 'Não informado';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {})
        };
        break;
      }

      case 'estoque': {
        const { data: pecas, error } = await supabase
          .from('pecas')
          .select('id, codigo, nome, categoria, preco_venda, preco_custo, estoque, estoque_minimo, ativo')
          .eq('organization_id', auth.organizationId)
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;

        data = pecas || [];

        const valorTotalEstoque = data.reduce((acc, p) => acc + ((p.estoque || 0) * (p.preco_custo || 0)), 0);
        const valorTotalVenda = data.reduce((acc, p) => acc + ((p.estoque || 0) * (p.preco_venda || 0)), 0);
        const pecasBaixoEstoque = data.filter(p => (p.estoque || 0) <= (p.estoque_minimo || 5));

        resumo = {
          total_pecas: data.length,
          total_unidades: data.reduce((acc, p) => acc + (p.estoque || 0), 0),
          valor_total_custo: valorTotalEstoque,
          valor_total_venda: valorTotalVenda,
          lucro_potencial: valorTotalVenda - valorTotalEstoque,
          pecas_baixo_estoque: pecasBaixoEstoque.length,
          por_categoria: data.reduce((acc: any, p) => {
            const cat = p.categoria || 'Sem categoria';
            if (!acc[cat]) acc[cat] = { quantidade: 0, valor: 0 };
            acc[cat].quantidade += p.estoque || 0;
            acc[cat].valor += (p.estoque || 0) * (p.preco_venda || 0);
            return acc;
          }, {})
        };
        break;
      }

      case 'revendedoras': {
        const { data: revendedoras, error } = await supabase
          .from('revendedoras')
          .select(`
            id,
            nome,
            telefone,
            whatsapp,
            email,
            cidade,
            estado,
            comissao_percentual,
            saldo_comissao,
            ativo
          `)
          .eq('organization_id', auth.organizationId)
          .order('nome');

        if (error) throw error;

        data = revendedoras || [];

        // Buscar vendas por revendedora (filtered by org)
        const { data: vendas } = await supabase
          .from('vendas')
          .select('revendedora_id, valor_total')
          .eq('organization_id', auth.organizationId)
          .not('revendedora_id', 'is', null);

        const vendasPorRevendedora = (vendas || []).reduce((acc: any, v) => {
          acc[v.revendedora_id] = (acc[v.revendedora_id] || 0) + (v.valor_total || 0);
          return acc;
        }, {});

        data = data.map(r => ({
          ...r,
          total_vendas: vendasPorRevendedora[r.id] || 0
        }));

        resumo = {
          total_revendedoras: data.length,
          ativas: data.filter(r => r.ativo).length,
          inativas: data.filter(r => !r.ativo).length,
          total_saldo_comissao: data.reduce((acc, r) => acc + (r.saldo_comissao || 0), 0),
          total_vendas: Object.values(vendasPorRevendedora).reduce((a: number, b: any) => a + b, 0),
          por_estado: data.reduce((acc: any, r) => {
            const estado = r.estado || 'Não informado';
            acc[estado] = (acc[estado] || 0) + 1;
            return acc;
          }, {})
        };
        break;
      }

      case 'clientes': {
        const { data: clientes, error } = await supabase
          .from('clientes')
          .select(`
            id,
            nome,
            telefone,
            whatsapp,
            email,
            cidade,
            estado,
            pontos_fidelidade,
            ativo
          `)
          .eq('organization_id', auth.organizationId)
          .order('nome');

        if (error) throw error;

        data = clientes || [];

        // Buscar vendas por cliente (filtered by org)
        const { data: vendas } = await supabase
          .from('vendas')
          .select('cliente_id, valor_total')
          .eq('organization_id', auth.organizationId)
          .not('cliente_id', 'is', null);

        const vendasPorCliente = (vendas || []).reduce((acc: any, v) => {
          if (!acc[v.cliente_id]) acc[v.cliente_id] = { total: 0, quantidade: 0 };
          acc[v.cliente_id].total += v.valor_total || 0;
          acc[v.cliente_id].quantidade += 1;
          return acc;
        }, {});

        data = data.map(c => ({
          ...c,
          total_compras: vendasPorCliente[c.id]?.total || 0,
          quantidade_compras: vendasPorCliente[c.id]?.quantidade || 0
        }));

        resumo = {
          total_clientes: data.length,
          ativos: data.filter(c => c.ativo).length,
          inativos: data.filter(c => !c.ativo).length,
          total_pontos_fidelidade: data.reduce((acc, c) => acc + (c.pontos_fidelidade || 0), 0),
          clientes_com_compras: data.filter(c => c.quantidade_compras > 0).length,
          por_estado: data.reduce((acc: any, c) => {
            const estado = c.estado || 'Não informado';
            acc[estado] = (acc[estado] || 0) + 1;
            return acc;
          }, {})
        };
        break;
      }

      case 'maletas': {
        const { data: maletas, error } = await supabase
          .from('maletas')
          .select(`
            id,
            codigo,
            nome,
            status,
            data_entrega,
            data_devolucao,
            valor_total,
            revendedoras (nome)
          `)
          .eq('organization_id', auth.organizationId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        data = (maletas || []).map((m: any) => ({
          id: m.id,
          codigo: m.codigo,
          nome: m.nome,
          status: m.status,
          data_entrega: m.data_entrega,
          data_devolucao: m.data_devolucao,
          valor_total: m.valor_total,
          revendedora_nome: m.revendedoras?.nome || '-'
        }));

        resumo = {
          total_maletas: data.length,
          por_status: data.reduce((acc: any, m) => {
            const status = m.status || 'Não informado';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {}),
          valor_total: data.reduce((acc, m) => acc + (m.valor_total || 0), 0)
        };
        break;
      }

      default:
        throw new Error(`Tipo de relatório não suportado: ${tipo}`);
    }

    // Se formato CSV, converter os dados
    if (formato === 'csv') {
      const csv = convertToCSV(data);
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }

    console.log(`Relatório ${tipo} gerado com sucesso. ${data.length} registros.`);

    return new Response(
      JSON.stringify({
        success: true,
        tipo,
        periodo: { dataInicio, dataFim },
        geradoEm: new Date().toISOString(),
        resumo,
        dados: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Erro ao gerar relatório:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(';')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      if (typeof val === 'number') return val.toString().replace('.', ',');
      return String(val);
    });
    csvRows.push(values.join(';'));
  }
  
  return '\ufeff' + csvRows.join('\n'); // BOM for Excel UTF-8
}
