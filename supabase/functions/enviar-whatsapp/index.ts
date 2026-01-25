import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  tipo: 'recibo' | 'catalogo' | 'aniversario' | 'cobranca' | 'promocao' | 'personalizado';
  telefone: string;
  dados: {
    // Para recibo
    vendaId?: string;
    items?: Array<{ nome: string; quantidade: number; preco: number }>;
    total?: number;
    clienteNome?: string;
    
    // Para catálogo
    catalogoNome?: string;
    catalogoUrl?: string;
    
    // Para aniversário
    nome?: string;
    
    // Para cobrança
    valor?: number;
    dataVencimento?: string;
    maletaCodigo?: string;
    
    // Para promoção
    promocaoTitulo?: string;
    promocaoDescricao?: string;
    desconto?: number;
    
    // Para mensagem personalizada
    mensagem?: string;
  };
}

interface WhatsAppResponse {
  success: boolean;
  url?: string;
  mensagem?: string;
  error?: string;
}

// Templates de mensagens
const templates = {
  recibo: (dados: WhatsAppRequest['dados']) => {
    const data = new Date().toLocaleString('pt-BR');
    let msg = `🧾 *RECIBO DE VENDA*\n`;
    msg += `📅 ${data}\n`;
    
    if (dados.clienteNome) {
      msg += `👤 Cliente: ${dados.clienteNome}\n`;
    }
    
    msg += `\n*Itens:*\n`;
    msg += `──────────────────\n`;
    
    for (const item of dados.items || []) {
      const subtotal = item.quantidade * item.preco;
      msg += `• ${item.nome}\n`;
      msg += `  ${item.quantidade}x R$ ${item.preco.toFixed(2)} = R$ ${subtotal.toFixed(2)}\n`;
    }
    
    msg += `──────────────────\n`;
    msg += `💰 *TOTAL: R$ ${(dados.total || 0).toFixed(2)}*\n\n`;
    msg += `✨ Obrigado pela preferência!`;
    
    return msg;
  },
  
  catalogo: (dados: WhatsAppRequest['dados']) => {
    return `✨ Confira nosso catálogo *${dados.catalogoNome || 'de produtos'}*!\n\n` +
           `👉 ${dados.catalogoUrl}\n\n` +
           `Peças exclusivas esperando por você! 💎`;
  },
  
  aniversario: (dados: WhatsAppRequest['dados']) => {
    return `🎂 *Feliz Aniversário, ${dados.nome}!*\n\n` +
           `Desejamos um dia repleto de alegrias e realizações! 🎉\n\n` +
           `Como presente especial, você ganha *10% de desconto* na sua próxima compra! 🎁\n\n` +
           `Válido por 7 dias. Aproveite! ✨`;
  },
  
  cobranca: (dados: WhatsAppRequest['dados']) => {
    let msg = `📋 *Lembrete de Devolução*\n\n`;
    msg += `Olá! Este é um lembrete amigável sobre:\n\n`;
    
    if (dados.maletaCodigo) {
      msg += `📦 Maleta: *${dados.maletaCodigo}*\n`;
    }
    if (dados.valor) {
      msg += `💰 Valor: *R$ ${dados.valor.toFixed(2)}*\n`;
    }
    if (dados.dataVencimento) {
      msg += `📅 Vencimento: *${new Date(dados.dataVencimento).toLocaleDateString('pt-BR')}*\n`;
    }
    
    msg += `\nEm caso de dúvidas, estamos à disposição! 😊`;
    
    return msg;
  },
  
  promocao: (dados: WhatsAppRequest['dados']) => {
    let msg = `🔥 *${dados.promocaoTitulo || 'PROMOÇÃO ESPECIAL'}* 🔥\n\n`;
    
    if (dados.promocaoDescricao) {
      msg += `${dados.promocaoDescricao}\n\n`;
    }
    
    if (dados.desconto) {
      msg += `💥 *${dados.desconto}% DE DESCONTO!* 💥\n\n`;
    }
    
    msg += `⏰ Por tempo limitado!\n`;
    msg += `Não perca essa oportunidade! 🛍️`;
    
    return msg;
  },
  
  personalizado: (dados: WhatsAppRequest['dados']) => {
    return dados.mensagem || 'Olá! Temos novidades para você!';
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: WhatsAppRequest = await req.json();
    const { tipo, telefone, dados } = body;

    console.log(`Gerando mensagem WhatsApp: ${tipo}`, { telefone });

    if (!telefone) {
      throw new Error('Telefone é obrigatório');
    }

    if (!tipo || !templates[tipo]) {
      throw new Error(`Tipo de mensagem inválido: ${tipo}`);
    }

    // Se for recibo e tiver vendaId, buscar dados da venda
    if (tipo === 'recibo' && dados.vendaId && !dados.items) {
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select(`
          id,
          valor_total,
          clientes (nome)
        `)
        .eq('id', dados.vendaId)
        .single();

      if (vendaError) {
        console.error('Erro ao buscar venda:', vendaError);
      } else if (venda) {
        dados.total = venda.valor_total;
        dados.clienteNome = (venda.clientes as any)?.nome;

        // Buscar itens da venda
        const { data: itens } = await supabase
          .from('vendas_pecas')
          .select(`
            quantidade,
            preco_unitario,
            pecas (nome)
          `)
          .eq('venda_id', dados.vendaId);

        dados.items = (itens || []).map((i: any) => ({
          nome: i.pecas?.nome || 'Item',
          quantidade: i.quantidade,
          preco: i.preco_unitario
        }));
      }
    }

    // Gerar mensagem usando o template
    const mensagem = templates[tipo](dados);

    // Limpar e formatar telefone
    let cleanPhone = telefone.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = `55${cleanPhone}`;
    }

    // Gerar URL do WhatsApp
    const encodedMessage = encodeURIComponent(mensagem);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    console.log(`Mensagem ${tipo} gerada com sucesso para ${cleanPhone}`);

    // Registrar envio (opcional - para histórico)
    try {
      await supabase.from('historico_atividades').insert({
        tabela: 'whatsapp',
        acao: 'envio',
        dados_novos: {
          tipo,
          telefone: cleanPhone,
          timestamp: new Date().toISOString()
        }
      });
    } catch {
      // Ignorar erro de registro
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: whatsappUrl,
        mensagem,
        telefone: cleanPhone
      } as WhatsAppResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Erro ao gerar mensagem WhatsApp:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as WhatsAppResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
