import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Tool definitions for the AI agent
const allTools = [
  {
    id: 'buscar_pecas',
    tool: {
      type: "function",
      function: {
        name: "buscar_produtos",
        description: "Busca produtos/peças no catálogo por nome, código, categoria ou faixa de preço. Use SEMPRE que o cliente perguntar sobre produtos, preços, disponibilidade ou para recomendar peças.",
        parameters: {
          type: "object",
          properties: {
            termo: { type: "string", description: "Termo de busca (nome, código, categoria, material, cor, estilo)" },
            categoria: { type: "string", description: "Filtrar por categoria específica" },
            preco_max: { type: "number", description: "Preço máximo" },
            preco_min: { type: "number", description: "Preço mínimo" },
            limite: { type: "number", description: "Número máximo de resultados (padrão 10)" }
          }
        }
      }
    }
  },
  {
    id: 'listar_catalogos',
    tool: {
      type: "function",
      function: {
        name: "listar_catalogos",
        description: "Lista os catálogos disponíveis. Use para mostrar coleções, novidades e promoções ao cliente.",
        parameters: {
          type: "object",
          properties: {
            ativo: { type: "boolean", description: "Filtrar apenas catálogos ativos" }
          }
        }
      }
    }
  },
  {
    id: 'listar_catalogos',
    tool: {
      type: "function",
      function: {
        name: "gerar_link_catalogo",
        description: "Gera um link de compartilhamento para um catálogo específico. Use para enviar o link do catálogo diretamente ao cliente.",
        parameters: {
          type: "object",
          properties: {
            catalogo_id: { type: "string", description: "ID do catálogo" }
          },
          required: ["catalogo_id"]
        }
      }
    }
  },
  {
    id: 'buscar_pecas',
    tool: {
      type: "function",
      function: {
        name: "enviar_foto_produto",
        description: "Busca e retorna detalhes completos de um produto incluindo foto para enviar ao cliente. Use quando o cliente pedir para ver uma peça ou quando quiser mostrar um produto específico.",
        parameters: {
          type: "object",
          properties: {
            peca_id: { type: "string", description: "ID da peça para buscar foto e detalhes" },
            termo: { type: "string", description: "Nome ou código da peça para buscar" }
          }
        }
      }
    }
  },
  {
    id: 'gerar_pix',
    tool: {
      type: "function",
      function: {
        name: "gerar_pix",
        description: "Gera informações de pagamento PIX. Use quando o cliente confirmar a compra ou pedir para pagar.",
        parameters: {
          type: "object",
          properties: {
            valor: { type: "number", description: "Valor do PIX em reais" },
            descricao: { type: "string", description: "Descrição do pagamento" }
          },
          required: ["valor"]
        }
      }
    }
  },
  {
    id: 'verificar_pedido',
    tool: {
      type: "function",
      function: {
        name: "consultar_pedido",
        description: "Consulta status de um pedido pelo número ou nome do cliente.",
        parameters: {
          type: "object",
          properties: {
            numero_pedido: { type: "string", description: "Número do pedido" },
            nome_cliente: { type: "string", description: "Nome do cliente" }
          }
        }
      }
    }
  },
  {
    id: 'criar_pedido',
    tool: {
      type: "function",
      function: {
        name: "criar_pedido",
        description: "Cria um novo pedido no sistema com TODOS os itens do carrinho. Use quando o cliente confirmar a compra. Pergunte o nome e telefone do cliente antes de criar.",
        parameters: {
          type: "object",
          properties: {
            cliente_nome: { type: "string", description: "Nome do cliente" },
            cliente_telefone: { type: "string", description: "Telefone do cliente" },
            itens: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  peca_id: { type: "string" },
                  quantidade: { type: "number" }
                }
              },
              description: "Lista de itens do pedido" 
            },
            observacoes: { type: "string", description: "Observações do pedido" }
          },
          required: ["cliente_nome", "itens"]
        }
      }
    }
  },
  {
    id: 'enviar_whatsapp',
    tool: {
      type: "function",
      function: {
        name: "enviar_whatsapp",
        description: "Envia uma mensagem via WhatsApp para o cliente. Use para enviar confirmações, links de catálogos, informações sobre produtos.",
        parameters: {
          type: "object",
          properties: {
            telefone: { type: "string", description: "Número do telefone (com DDD, ex: 11999999999)" },
            mensagem: { type: "string", description: "Mensagem a ser enviada" }
          },
          required: ["telefone", "mensagem"]
        }
      }
    }
  },
  {
    id: 'enviar_whatsapp',
    tool: {
      type: "function",
      function: {
        name: "enviar_whatsapp_midia",
        description: "Envia uma imagem ou arquivo via WhatsApp para o cliente. Use para enviar fotos de produtos, catálogos visuais.",
        parameters: {
          type: "object",
          properties: {
            telefone: { type: "string", description: "Número do telefone (com DDD)" },
            midia_url: { type: "string", description: "URL da imagem ou arquivo" },
            legenda: { type: "string", description: "Legenda da mídia" }
          },
          required: ["telefone", "midia_url"]
        }
      }
    }
  },
  {
    id: 'consultar_estoque',
    tool: {
      type: "function",
      function: {
        name: "consultar_estoque",
        description: "Verifica a quantidade em estoque de um produto específico.",
        parameters: {
          type: "object",
          properties: {
            codigo: { type: "string", description: "Código ou nome do produto" }
          },
          required: ["codigo"]
        }
      }
    }
  },
  {
    id: 'transferir_humano',
    tool: {
      type: "function",
      function: {
        name: "transferir_para_humano",
        description: "Transfere o atendimento para um atendente humano. Use APENAS quando o cliente pedir explicitamente ou quando a situação for realmente complexa demais.",
        parameters: {
          type: "object",
          properties: {
            motivo: { type: "string", description: "Motivo da transferência" },
            prioridade: { type: "number", description: "Nível de prioridade (0=normal, 1=alta)" }
          }
        }
      }
    }
  },
  {
    id: 'buscar_faq',
    tool: {
      type: "function",
      function: {
        name: "buscar_faq",
        description: "Busca respostas em perguntas frequentes cadastradas.",
        parameters: {
          type: "object",
          properties: {
            pergunta: { type: "string", description: "Pergunta ou palavras-chave para buscar" }
          },
          required: ["pergunta"]
        }
      }
    }
  },
  {
    id: 'enviar_nps',
    tool: {
      type: "function",
      function: {
        name: "enviar_pesquisa_satisfacao",
        description: "Envia pesquisa de satisfação. Use ao final do atendimento quando o cliente indicar que terminou.",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    }
  },
  {
    id: 'enviar_email',
    tool: {
      type: "function",
      function: {
        name: "enviar_email_automatico",
        description: "Envia um e-mail automático para o cliente usando um template pré-configurado. Use nas seguintes ocasiões: após criar um pedido (confirmação), após resolver um problema (follow-up), para enviar promoções, para dar boas-vindas, ou quando o cliente pedir algo por e-mail.",
        parameters: {
          type: "object",
          properties: {
            tipo_template: { 
              type: "string", 
              description: "Tipo do template: confirmacao_pedido, follow_up, resumo_conversa, marketing, geral",
              enum: ["confirmacao_pedido", "follow_up", "resumo_conversa", "marketing", "geral"]
            },
            destinatario_email: { type: "string", description: "E-mail do destinatário" },
            cliente_nome: { type: "string", description: "Nome do cliente" },
            pedido_numero: { type: "string", description: "Número do pedido (quando aplicável)" },
            pedido_valor: { type: "string", description: "Valor do pedido (quando aplicável)" }
          },
          required: ["tipo_template", "destinatario_email", "cliente_nome"]
        }
      }
    }
  },
  // === NEW TOOLS ===
  {
    id: 'buscar_pecas',
    tool: {
      type: "function",
      function: {
        name: "gerenciar_carrinho",
        description: "Gerencia o carrinho de compras do cliente. Use para adicionar, remover itens ou mostrar o resumo do carrinho. O cliente pode ir adicionando peças e fechar tudo junto no final.",
        parameters: {
          type: "object",
          properties: {
            acao: { 
              type: "string", 
              description: "Ação: adicionar, remover, ver, limpar",
              enum: ["adicionar", "remover", "ver", "limpar"]
            },
            peca_id: { type: "string", description: "ID da peça (para adicionar/remover)" },
            quantidade: { type: "number", description: "Quantidade (padrão 1)" }
          },
          required: ["acao"]
        }
      }
    }
  },
  {
    id: 'buscar_pecas',
    tool: {
      type: "function",
      function: {
        name: "sugerir_complementos",
        description: "Sugere peças complementares baseado no que o cliente está vendo/comprando. Use para fazer upsell/cross-sell inteligente após o cliente demonstrar interesse em um produto.",
        parameters: {
          type: "object",
          properties: {
            peca_id: { type: "string", description: "ID da peça que o cliente está vendo" },
            categoria_atual: { type: "string", description: "Categoria da peça atual (anel, brinco, colar, pulseira)" }
          },
          required: ["categoria_atual"]
        }
      }
    }
  }
];

// Get filtered tools based on config
function getActiveTools(config: Record<string, unknown> | null) {
  const ferramentasAtivas = config?.ferramentas_ativas as Record<string, boolean> || {
    consultar_estoque: true,
    buscar_pecas: true,
    gerar_pix: true,
    enviar_whatsapp: true,
    listar_catalogos: true,
    criar_pedido: true,
    verificar_pedido: true,
    transferir_humano: true,
    buscar_faq: true,
    enviar_nps: true,
    enviar_email: true
  };

  return allTools
    .filter(t => ferramentasAtivas[t.id] !== false)
    .map(t => t.tool);
}

// Check if within business hours
function isWithinBusinessHours(config: Record<string, unknown> | null): { isOpen: boolean; message?: string } {
  const horario = config?.horario_funcionamento as { 
    ativo: boolean; 
    inicio: string; 
    fim: string; 
    dias: number[]; 
    mensagem_fora: string 
  } | null;

  if (!horario?.ativo) {
    return { isOpen: true };
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const isWorkingDay = horario.dias?.includes(currentDay);
  const isWorkingHour = currentTime >= horario.inicio && currentTime <= horario.fim;

  if (!isWorkingDay || !isWorkingHour) {
    return { 
      isOpen: false, 
      message: horario.mensagem_fora || 'Nosso atendimento está fechado no momento. Retornaremos em breve!' 
    };
  }

  return { isOpen: true };
}

// Get tone instructions
function getToneInstructions(tom: string): string {
  const tones: Record<string, string> = {
    profissional: 'Seja formal, objetivo e profissional. Use linguagem clara e direta.',
    amigavel: 'Seja casual, acolhedor e use uma linguagem informal. Trate o cliente como um amigo.',
    entusiasmado: 'Seja animado e expressivo! Use emojis com frequência e demonstre empolgação.',
    tecnico: 'Seja detalhado e preciso. Forneça informações técnicas quando relevante.',
    minimalista: 'Seja extremamente conciso. Respostas curtas e diretas, sem floreios.'
  };
  return tones[tom] || tones.profissional;
}

// Complementary categories for upsell
const complementaryCategories: Record<string, string[]> = {
  'anel': ['pulseira', 'brinco', 'aliança'],
  'brinco': ['colar', 'anel', 'conjunto'],
  'colar': ['brinco', 'pulseira', 'pingente'],
  'pulseira': ['anel', 'colar', 'bracelete'],
  'pingente': ['corrente', 'colar', 'brinco'],
  'corrente': ['pingente', 'pulseira', 'anel'],
  'conjunto': ['brinco', 'anel', 'pulseira'],
  'aliança': ['anel', 'pulseira', 'brinco'],
  'tornozeleira': ['pulseira', 'anel', 'brinco'],
};

// In-memory cart storage (per session, cleared on restart)
const sessionCarts: Map<string, Array<{ peca_id: string; nome: string; preco: number; quantidade: number }>> = new Map();

// Tool execution functions
async function executarTool(
  toolName: string, 
  args: Record<string, unknown>, 
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  config: Record<string, unknown>,
  sessionId?: string
): Promise<string> {
  console.log(`Executing tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      case "buscar_produtos": {
        let query = supabase
          .from('pecas')
          .select('id, nome, codigo, categoria, preco_venda, preco_revenda, estoque, imagem_url, descricao, material, peso')
          .eq('organization_id', organizationId)
          .eq('ativo', true)
          .limit(args.limite as number || 10);

        if (args.termo) {
          query = query.or(`nome.ilike.%${args.termo}%,codigo.ilike.%${args.termo}%,categoria.ilike.%${args.termo}%,descricao.ilike.%${args.termo}%`);
        }
        if (args.categoria) {
          query = query.ilike('categoria', `%${args.categoria}%`);
        }
        if (args.preco_min) {
          query = query.gte('preco_venda', args.preco_min);
        }
        if (args.preco_max) {
          query = query.lte('preco_venda', args.preco_max);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
          return "Nenhum produto encontrado com os critérios informados. Tente buscar com termos diferentes.";
        }

        return `Encontrei ${data.length} produto(s):\n` + data.map((p: Record<string, unknown>) => {
          const imgUrl = p.imagem_url ? String(p.imagem_url).replace(/#$/, '') : '';
          return `• [ID: ${p.id}] ${p.nome} (Cód: ${p.codigo || 'N/A'}) - R$ ${(p.preco_venda as number)?.toFixed(2) || 'Consultar'} - Estoque: ${p.estoque || 0}${p.categoria ? ` - Cat: ${p.categoria}` : ''}${p.material ? ` - Material: ${p.material}` : ''}${p.descricao ? ` - ${p.descricao}` : ''}${imgUrl ? `\n  IMAGEM_URL: ${imgUrl}` : ' (sem foto)'}`;
        }).join('\n');
      }

      case "enviar_foto_produto": {
        let peca = null;
        
        if (args.peca_id) {
          const { data } = await supabase
            .from('pecas')
            .select('id, nome, codigo, categoria, preco_venda, estoque, imagem_url, descricao, material, peso')
            .eq('id', args.peca_id)
            .eq('organization_id', organizationId)
            .single();
          peca = data;
        } else if (args.termo) {
          const { data } = await supabase
            .from('pecas')
            .select('id, nome, codigo, categoria, preco_venda, estoque, imagem_url, descricao, material, peso')
            .eq('organization_id', organizationId)
            .eq('ativo', true)
            .or(`nome.ilike.%${args.termo}%,codigo.ilike.%${args.termo}%`)
            .limit(1)
            .maybeSingle();
          peca = data;
        }

        if (!peca) {
          return "Produto não encontrado.";
        }

        const info = `📸 **${peca.nome}**
Código: ${peca.codigo || 'N/A'}
Preço: R$ ${(peca.preco_venda as number)?.toFixed(2) || 'Consultar'}
Estoque: ${peca.estoque || 0} unidades
${peca.categoria ? `Categoria: ${peca.categoria}` : ''}
${peca.material ? `Material: ${peca.material}` : ''}
${peca.descricao ? `Descrição: ${peca.descricao}` : ''}
${peca.imagem_url ? `IMAGEM_URL: ${String(peca.imagem_url).replace(/#$/, '')}` : 'Sem foto disponível'}
ID: ${peca.id}`;

        return info;
      }

      case "listar_catalogos": {
        let query = supabase
          .from('catalogos')
          .select('id, nome, slug, descricao, data_validade')
          .eq('organization_id', organizationId);

        if (args.ativo !== false) {
          query = query.eq('ativo', true);
        }

        const { data, error } = await query.limit(10);
        if (error) throw error;

        if (!data || data.length === 0) {
          return "Não há catálogos disponíveis no momento.";
        }

        return `Catálogos disponíveis:\n` + data.map((c: Record<string, unknown>) => 
          `• ${c.nome}${c.descricao ? ` - ${c.descricao}` : ''}${c.data_validade ? ` (válido até ${new Date(c.data_validade as string).toLocaleDateString('pt-BR')})` : ''}`
        ).join('\n');
      }

      case "gerar_link_catalogo": {
        const { data: catalogo, error } = await supabase
          .from('catalogos')
          .select('id, nome, slug')
          .eq('id', args.catalogo_id)
          .eq('organization_id', organizationId)
          .single();

        if (error || !catalogo) {
          return "Catálogo não encontrado.";
        }

        const baseUrl = Deno.env.get('APP_URL') || 'https://nexsiles2567.lovable.app';
        const link = `${baseUrl}/catalogo/${catalogo.slug || catalogo.id}`;
        
        return `Link do catálogo "${catalogo.nome}":\n${link}\n\nVocê pode compartilhar este link com seus clientes!`;
      }

      case "gerar_pix": {
        const valor = args.valor as number;
        const descricao = args.descricao as string || 'Pagamento';
        
        const pixChave = config.pix_chave as string;
        const pixTipo = config.pix_tipo as string;
        const pixNome = config.pix_nome as string;

        if (!pixChave) {
          return "⚠️ Chave PIX não configurada. Por favor, configure nas configurações do agente.";
        }

        return `💳 **Dados para pagamento PIX:**

**Valor:** R$ ${valor.toFixed(2)}
**Descrição:** ${descricao}

**Chave PIX (${pixTipo}):** \`${pixChave}\`
${pixNome ? `**Nome do beneficiário:** ${pixNome}` : ''}

Por favor, após efetuar o pagamento, envie o comprovante para confirmarmos seu pedido! ✅`;
      }

      case "consultar_pedido": {
        let query = supabase
          .from('vendas')
          .select(`
            id, numero, status, valor_total, data_venda, observacoes,
            clientes:cliente_id (nome, telefone)
          `)
          .eq('organization_id', organizationId);

        if (args.numero_pedido) {
          query = query.eq('numero', args.numero_pedido);
        }

        const { data, error } = await query.limit(5).order('created_at', { ascending: false });
        if (error) throw error;

        if (!data || data.length === 0) {
          return "Nenhum pedido encontrado com os dados informados.";
        }

        // Filter by client name if provided
        let pedidos = data;
        if (args.nome_cliente) {
          pedidos = data.filter((p: Record<string, unknown>) => {
            const cliente = p.clientes as Record<string, unknown> | null;
            return cliente?.nome?.toString().toLowerCase().includes((args.nome_cliente as string).toLowerCase());
          });
        }

        if (pedidos.length === 0) {
          return "Nenhum pedido encontrado para este cliente.";
        }

        return `Pedido(s) encontrado(s):\n` + pedidos.map((p: Record<string, unknown>) => {
          const cliente = p.clientes as Record<string, unknown> | null;
          return `• Pedido #${p.numero || p.id?.toString().slice(0, 8)} - Status: ${p.status || 'Em andamento'} - R$ ${(p.valor_total as number)?.toFixed(2) || '0.00'} - ${cliente?.nome || 'Cliente não identificado'}`;
        }).join('\n');
      }

      case "criar_pedido": {
        const itens = args.itens as Array<{ peca_id: string; quantidade: number }>;
        
        if (!itens || itens.length === 0) {
          // Check if there's a cart for this session
          const cartKey = sessionId || '__no_session__';
          const cart = sessionCarts.get(cartKey);
          if (cart && cart.length > 0) {
            // Use cart items
            const cartItens = cart.map(item => ({ peca_id: item.peca_id, quantidade: item.quantidade }));
            args.itens = cartItens;
            // Continue with cart items below
          } else {
            return "É necessário informar pelo menos um item para criar o pedido. Use o carrinho para adicionar itens primeiro!";
          }
        }

        const finalItens = (args.itens || itens) as Array<{ peca_id: string; quantidade: number }>;

        // Get pieces info
        const pecaIds = finalItens.map(i => i.peca_id);
        const { data: pecas, error: pecasError } = await supabase
          .from('pecas')
          .select('id, nome, preco_venda')
          .in('id', pecaIds)
          .eq('organization_id', organizationId);

        if (pecasError || !pecas || pecas.length === 0) {
          return "Não foi possível encontrar as peças informadas.";
        }

        // Calculate total
        let subtotal = 0;
        const pecasMap = new Map(pecas.map((p: Record<string, unknown>) => [p.id, p]));
        
        for (const item of finalItens) {
          const peca = pecasMap.get(item.peca_id) as Record<string, unknown> | undefined;
          if (peca) {
            subtotal += (peca.preco_venda as number || 0) * item.quantidade;
          }
        }

        // Create or find client
        let clienteId = null;
        if (args.cliente_nome) {
          const { data: existingClient } = await supabase
            .from('clientes')
            .select('id')
            .eq('organization_id', organizationId)
            .ilike('nome', args.cliente_nome as string)
            .maybeSingle();

          if (existingClient) {
            clienteId = existingClient.id;
          } else {
            const { data: newClient } = await supabase
              .from('clientes')
              .insert({
                nome: args.cliente_nome,
                telefone: args.cliente_telefone || null,
                organization_id: organizationId
              })
              .select('id')
              .single();
            
            if (newClient) {
              clienteId = newClient.id;
            }
          }
        }

        // Create sale
        const { data: venda, error: vendaError } = await supabase
          .from('vendas')
          .insert({
            organization_id: organizationId,
            cliente_id: clienteId,
            subtotal: subtotal,
            valor_total: subtotal,
            status: 'pendente',
            observacoes: args.observacoes || `Pedido via atendimento virtual - Cliente: ${args.cliente_nome}`
          })
          .select('id, numero')
          .single();

        if (vendaError || !venda) {
          console.error('Error creating sale:', vendaError);
          return "Erro ao criar o pedido. Por favor, tente novamente.";
        }

        // Create sale items
        const vendaItens = finalItens.map(item => {
          const peca = pecasMap.get(item.peca_id) as Record<string, unknown> | undefined;
          return {
            venda_id: venda.id,
            peca_id: item.peca_id,
            quantidade: item.quantidade,
            preco_unitario: (peca?.preco_venda as number) || 0,
            subtotal: ((peca?.preco_venda as number) || 0) * item.quantidade
          };
        });

        await supabase.from('vendas_pecas').insert(vendaItens);

        // Clear cart after successful order
        if (sessionId) {
          sessionCarts.delete(sessionId);
        }

        // Update client preferences
        if (clienteId) {
          try {
            const telefoneCliente = args.cliente_telefone as string;
            if (telefoneCliente) {
              const categoriasCompradas = pecas.map((p: any) => p.categoria).filter(Boolean);
              const produtosIds = pecas.map((p: any) => p.id);
              
              const { data: existingPrefs } = await supabase
                .from('cliente_preferencias')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('cliente_telefone', telefoneCliente.replace(/\D/g, ''))
                .maybeSingle();

              if (existingPrefs) {
                const currentCats = (existingPrefs.categorias_favoritas as string[]) || [];
                const currentProds = (existingPrefs.produtos_comprados as string[]) || [];
                await supabase.from('cliente_preferencias').update({
                  categorias_favoritas: [...new Set([...currentCats, ...categoriasCompradas])],
                  produtos_comprados: [...new Set([...currentProds, ...produtosIds])],
                  total_compras: (existingPrefs.total_compras || 0) + 1,
                  valor_total_compras: (existingPrefs.valor_total_compras || 0) + subtotal,
                  ultima_compra_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }).eq('id', existingPrefs.id);
              } else {
                await supabase.from('cliente_preferencias').insert({
                  organization_id: organizationId,
                  cliente_telefone: telefoneCliente.replace(/\D/g, ''),
                  categorias_favoritas: categoriasCompradas,
                  produtos_comprados: produtosIds,
                  total_compras: 1,
                  valor_total_compras: subtotal,
                  ultima_compra_at: new Date().toISOString(),
                });
              }
            }
          } catch (e) {
            console.error('Error updating client preferences:', e);
          }
        }

        const itensDesc = finalItens.map(item => {
          const peca = pecasMap.get(item.peca_id) as Record<string, unknown> | undefined;
          return `  - ${peca?.nome || 'Item'} x${item.quantidade} = R$ ${(((peca?.preco_venda as number) || 0) * item.quantidade).toFixed(2)}`;
        }).join('\n');

        return `✅ **Pedido criado com sucesso!**

**Número do pedido:** #${venda.numero || venda.id.toString().slice(0, 8)}
**Cliente:** ${args.cliente_nome}
**Itens:**
${itensDesc}
**Valor total:** R$ ${subtotal.toFixed(2)}
**Status:** Pendente

O pedido foi registrado e será processado em breve!`;
      }

      case "enviar_whatsapp": {
        const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
        const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
        
        if (!evolutionUrl || !evolutionKey) {
          const telefone = (args.telefone as string).replace(/\D/g, '');
          const mensagem = encodeURIComponent(args.mensagem as string);
          const link = `https://wa.me/55${telefone}?text=${mensagem}`;
          return `📱 Evolution API não configurada. Use este link:\n${link}`;
        }
        
        let telefone = (args.telefone as string).replace(/\D/g, '');
        if (!telefone.startsWith('55')) {
          telefone = '55' + telefone;
        }
        
        try {
          const instanceName = config?.whatsapp_instancia || 'default';
          
          const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey
            },
            body: JSON.stringify({
              number: telefone,
              text: args.mensagem
            })
          });
          
          if (!response.ok) {
            const errorData = await response.text();
            console.error('Evolution API error:', response.status, errorData);
            throw new Error(`Erro ao enviar: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('WhatsApp sent successfully:', result);
          
          return `✅ **Mensagem enviada com sucesso!**\n\nDestinatário: ${telefone}\nStatus: Entregue ao WhatsApp`;
        } catch (error) {
          console.error('Error sending WhatsApp:', error);
          const mensagem = encodeURIComponent(args.mensagem as string);
          const link = `https://wa.me/${telefone}?text=${mensagem}`;
          return `⚠️ Não foi possível enviar automaticamente. Use este link:\n${link}`;
        }
      }

      case "enviar_whatsapp_midia": {
        const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
        const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
        
        if (!evolutionUrl || !evolutionKey) {
          return `⚠️ Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY.`;
        }
        
        let telefone = (args.telefone as string).replace(/\D/g, '');
        if (!telefone.startsWith('55')) {
          telefone = '55' + telefone;
        }
        
        try {
          const instanceName = config?.whatsapp_instancia || 'default';
          
          const response = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey
            },
            body: JSON.stringify({
              number: telefone,
              mediatype: 'image',
              media: args.midia_url,
              caption: args.legenda || ''
            })
          });
          
          if (!response.ok) {
            const errorData = await response.text();
            console.error('Evolution API media error:', response.status, errorData);
            throw new Error(`Erro ao enviar mídia: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('WhatsApp media sent:', result);
          
          return `✅ **Imagem enviada com sucesso!**\n\nDestinatário: ${telefone}${args.legenda ? `\nLegenda: ${args.legenda}` : ''}`;
        } catch (error) {
          console.error('Error sending WhatsApp media:', error);
          return `❌ Erro ao enviar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        }
      }

      case "consultar_estoque": {
        const { data, error } = await supabase
          .from('pecas')
          .select('nome, codigo, estoque, estoque_minimo')
          .eq('organization_id', organizationId)
          .or(`codigo.ilike.%${args.codigo}%,nome.ilike.%${args.codigo}%`)
          .limit(5);

        if (error) throw error;

        if (!data || data.length === 0) {
          return "Produto não encontrado.";
        }

        return data.map((p: Record<string, unknown>) => 
          `• ${p.nome} (${p.codigo || 'N/A'}): ${p.estoque || 0} em estoque${p.estoque_minimo ? ` (mínimo: ${p.estoque_minimo})` : ''}`
        ).join('\n');
      }

      case "transferir_para_humano": {
        const { data: conversas } = await supabase
          .from('agente_conversas')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('status', 'ativa')
          .order('updated_at', { ascending: false })
          .limit(1);

        const conversaId = conversas?.[0]?.id;

        if (conversaId) {
          await supabase
            .from('agente_conversas')
            .update({ status: 'aguardando_humano' })
            .eq('id', conversaId);

          await supabase
            .from('agente_fila_humana')
            .insert({
              organization_id: organizationId,
              conversa_id: conversaId,
              motivo: args.motivo || 'Cliente solicitou atendimento humano',
              prioridade: args.prioridade || 0,
              status: 'aguardando'
            });
        }

        return `👤 **Transferindo para atendimento humano**

Sua solicitação foi registrada e um atendente humano assumirá a conversa em breve.

${args.motivo ? `Motivo: ${args.motivo}` : ''}

Por favor, aguarde. Você será notificado quando um atendente estiver disponível.`;
      }

      case "buscar_faq": {
        const pergunta = (args.pergunta as string).toLowerCase();
        
        const { data: faqs, error } = await supabase
          .from('agente_faqs')
          .select('id, pergunta, resposta, palavras_chave')
          .eq('organization_id', organizationId)
          .eq('ativo', true);

        if (error) throw error;

        if (!faqs || faqs.length === 0) {
          return "FAQ_NOT_FOUND";
        }

        const palavrasBusca = pergunta.split(/\s+/).filter(p => p.length > 2);
        
        let melhorMatch: { faq: Record<string, unknown>; score: number } | null = null;
        
        for (const faq of faqs) {
          let score = 0;
          const perguntaFaq = (faq.pergunta as string).toLowerCase();
          const palavrasChave = (faq.palavras_chave as string[]) || [];
          
          if (perguntaFaq.includes(pergunta) || pergunta.includes(perguntaFaq)) {
            score += 10;
          }
          
          for (const palavra of palavrasBusca) {
            if (perguntaFaq.includes(palavra)) score += 2;
            if (palavrasChave.some(k => k.toLowerCase().includes(palavra))) score += 3;
          }
          
          if (score > 0 && (!melhorMatch || score > melhorMatch.score)) {
            melhorMatch = { faq, score };
          }
        }

        if (melhorMatch && melhorMatch.score >= 2) {
          await supabase
            .from('agente_faqs')
            .update({ uso_count: (melhorMatch.faq.uso_count as number || 0) + 1 })
            .eq('id', melhorMatch.faq.id);
          
          return `FAQ_FOUND: ${melhorMatch.faq.resposta}`;
        }

        return "FAQ_NOT_FOUND";
      }

      case "enviar_pesquisa_satisfacao": {
        return `📊 **Pesquisa de Satisfação**

Gostaríamos muito de saber sua opinião sobre nosso atendimento!

Em uma escala de 0 a 10, quanto você recomendaria nosso atendimento para um amigo ou familiar?

- **0-6**: Precisa melhorar
- **7-8**: Bom atendimento
- **9-10**: Excelente atendimento!

Por favor, responda com um número de 0 a 10.`;
      }

      case "enviar_email_automatico": {
        const tipoTemplate = args.tipo_template as string;
        const email = args.destinatario_email as string;
        const clienteNome = args.cliente_nome as string;

        if (!email) return "⚠️ E-mail do destinatário não informado.";

        const { data: template, error: tplError } = await supabase
          .from('email_templates')
          .select('id, nome, assunto')
          .eq('organization_id', organizationId)
          .eq('tipo', tipoTemplate)
          .eq('ativo', true)
          .limit(1)
          .maybeSingle();

        if (tplError || !template) {
          return `⚠️ Nenhum template de e-mail do tipo "${tipoTemplate}" encontrado. Os templates são criados automaticamente no primeiro acesso.`;
        }

        const variaveis: Record<string, string> = {
          '{cliente_nome}': clienteNome,
          '{cliente_email}': email,
          '{data_hoje}': new Date().toLocaleDateString('pt-BR'),
        };
        if (args.pedido_numero) variaveis['{pedido_numero}'] = args.pedido_numero as string;
        if (args.pedido_valor) variaveis['{pedido_valor}'] = args.pedido_valor as string;

        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .maybeSingle();
        variaveis['{empresa_nome}'] = orgData?.name || 'Nossa Loja';

        let assunto = template.assunto;
        const { data: fullTemplate } = await supabase
          .from('email_templates')
          .select('corpo_html, corpo_texto')
          .eq('id', template.id)
          .single();

        let corpoHtml = fullTemplate?.corpo_html || '';
        let corpoTexto = fullTemplate?.corpo_texto || '';

        for (const [key, value] of Object.entries(variaveis)) {
          const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
          assunto = assunto.replace(regex, value);
          corpoHtml = corpoHtml.replace(regex, value);
          corpoTexto = corpoTexto.replace(regex, value);
        }

        try {
          const brevoKey = Deno.env.get('BREVO_API_KEY');
          if (!brevoKey) return "⚠️ Serviço de e-mail não configurado (BREVO_API_KEY).";

          const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "api-key": brevoKey,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              sender: { name: "NexSiles", email: "contato@nexsiles.com.br" },
              to: [{ email }],
              subject: assunto,
              htmlContent: corpoHtml,
              textContent: corpoTexto || undefined,
            }),
          });

          if (!brevoRes.ok) {
            const errBody = await brevoRes.text();
            console.error('Email send error:', errBody);
            await supabase.from('email_logs').insert({
              organization_id: organizationId,
              template_id: template.id,
              destinatario_email: email,
              destinatario_nome: clienteNome,
              assunto,
              status: 'erro',
              erro_mensagem: errBody,
            });
            return `❌ Erro ao enviar e-mail: ${errBody}`;
          }

          await supabase.from('email_logs').insert({
            organization_id: organizationId,
            template_id: template.id,
            destinatario_email: email,
            destinatario_nome: clienteNome,
            assunto,
            status: 'enviado',
            enviado_at: new Date().toISOString(),
          });

          return `✅ **E-mail enviado com sucesso!**\n\n📧 Para: ${email}\n📋 Template: ${template.nome}\n📌 Assunto: ${assunto}`;
        } catch (e) {
          console.error('Email error:', e);
          return `❌ Erro ao enviar e-mail: ${e instanceof Error ? e.message : 'Erro desconhecido'}`;
        }
      }

      // === NEW TOOLS ===

      case "gerenciar_carrinho": {
        const cartKey = sessionId || '__no_session__';
        const acao = args.acao as string;

        if (acao === 'ver' || acao === 'limpar') {
          if (acao === 'limpar') {
            sessionCarts.delete(cartKey);
            return "🗑️ Carrinho limpo com sucesso!";
          }
          const cart = sessionCarts.get(cartKey);
          if (!cart || cart.length === 0) {
            return "🛒 Seu carrinho está vazio. Que tal adicionar algumas peças? Posso te mostrar nossos destaques!";
          }
          const total = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
          const itensStr = cart.map((item, i) => 
            `${i + 1}. ${item.nome} x${item.quantidade} = R$ ${(item.preco * item.quantidade).toFixed(2)}`
          ).join('\n');
          return `🛒 **Seu Carrinho:**\n\n${itensStr}\n\n**Total: R$ ${total.toFixed(2)}**\n\n${cart.length} item(ns). Deseja adicionar mais peças ou finalizar o pedido?`;
        }

        if (acao === 'adicionar') {
          if (!args.peca_id) return "Preciso do ID da peça para adicionar ao carrinho.";
          
          const { data: peca } = await supabase
            .from('pecas')
            .select('id, nome, preco_venda, estoque')
            .eq('id', args.peca_id)
            .eq('organization_id', organizationId)
            .single();

          if (!peca) return "Peça não encontrada.";
          if ((peca.estoque || 0) <= 0) return `❌ "${peca.nome}" está sem estoque no momento.`;

          const cart = sessionCarts.get(cartKey) || [];
          const existingIdx = cart.findIndex(item => item.peca_id === peca.id);
          const qty = (args.quantidade as number) || 1;

          if (existingIdx >= 0) {
            cart[existingIdx].quantidade += qty;
          } else {
            cart.push({ peca_id: peca.id, nome: peca.nome, preco: peca.preco_venda || 0, quantidade: qty });
          }
          sessionCarts.set(cartKey, cart);

          const total = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
          return `✅ **"${peca.nome}" adicionado ao carrinho!**\n\n🛒 Carrinho: ${cart.length} item(ns) | Total: R$ ${total.toFixed(2)}\n\nDeseja adicionar mais peças ou finalizar o pedido?`;
        }

        if (acao === 'remover') {
          if (!args.peca_id) return "Preciso do ID da peça para remover do carrinho.";
          const cart = sessionCarts.get(cartKey) || [];
          const idx = cart.findIndex(item => item.peca_id === args.peca_id);
          if (idx < 0) return "Esta peça não está no carrinho.";
          const removed = cart.splice(idx, 1)[0];
          sessionCarts.set(cartKey, cart);
          return `🗑️ **"${removed.nome}" removido do carrinho.**\n\n🛒 ${cart.length} item(ns) restante(s).`;
        }

        return "Ação não reconhecida. Use: adicionar, remover, ver ou limpar.";
      }

      case "sugerir_complementos": {
        const categoriaAtual = (args.categoria_atual as string || '').toLowerCase();
        const complementares = complementaryCategories[categoriaAtual] || ['brinco', 'colar', 'pulseira'];
        
        // Fetch complementary products
        const { data: sugestoes, error } = await supabase
          .from('pecas')
          .select('id, nome, codigo, categoria, preco_venda, imagem_url, descricao, material')
          .eq('organization_id', organizationId)
          .eq('ativo', true)
          .gt('estoque', 0)
          .in('categoria', complementares.map(c => c.charAt(0).toUpperCase() + c.slice(1)))
          .limit(6);

        if (error) throw error;

        if (!sugestoes || sugestoes.length === 0) {
          // Fallback: get any products from different category
          const { data: fallback } = await supabase
            .from('pecas')
            .select('id, nome, codigo, categoria, preco_venda, imagem_url, descricao')
            .eq('organization_id', organizationId)
            .eq('ativo', true)
            .gt('estoque', 0)
            .not('categoria', 'ilike', `%${categoriaAtual}%`)
            .limit(4);
          
          if (!fallback || fallback.length === 0) {
            return "Não encontrei sugestões complementares no momento.";
          }

          return `✨ **Sugestões que combinam:**\n\n` + fallback.map((p: any) => {
            const imgUrl = p.imagem_url ? String(p.imagem_url).replace(/#$/, '') : '';
            return `• [ID: ${p.id}] ${p.nome} - R$ ${p.preco_venda?.toFixed(2) || '?'} (${p.categoria || 'Acessório'})${imgUrl ? `\n  IMAGEM_URL: ${imgUrl}` : ''}`;
          }).join('\n');
        }

        return `✨ **Combina perfeitamente com ${categoriaAtual}:**\n\n` + sugestoes.map((p: any) => {
          const imgUrl = p.imagem_url ? String(p.imagem_url).replace(/#$/, '') : '';
          return `• [ID: ${p.id}] ${p.nome} - R$ ${p.preco_venda?.toFixed(2) || '?'} (${p.categoria})${p.material ? ` | ${p.material}` : ''}${imgUrl ? `\n  IMAGEM_URL: ${imgUrl}` : ''}`;
        }).join('\n') + `\n\nQuer ver alguma dessas peças mais de perto? 💎`;
      }

      default:
        return `Ferramenta '${toolName}' não reconhecida.`;
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return `Erro ao executar a ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, organizationId, sessionId, clienteTelefone } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get agent config
    const { data: config } = await supabase
      .from('agente_ia_config')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    // DeepSeek AI provider (único)
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY não configurada. Adicione a chave nas configurações do Supabase.");
    }

    const aiBaseUrl = 'https://api.deepseek.com/chat/completions';
    const aiHeaders: Record<string, string> = {
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    };
    const aiModel = 'deepseek-chat';

    console.log('Using AI provider: DeepSeek');

    // Check if agent is active
    if (config?.ativo === false) {
      return new Response(JSON.stringify({
        content: 'O atendimento virtual está temporariamente desativado. Por favor, tente novamente mais tarde.',
        role: 'assistant'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check business hours
    const businessHours = isWithinBusinessHours(config);
    if (!businessHours.isOpen) {
      return new Response(JSON.stringify({
        content: businessHours.message,
        role: 'assistant'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get active tools based on configuration
    const activeTools = getActiveTools(config);

    // Build dynamic system prompt
    const toneInstructions = getToneInstructions(config?.tom_resposta || 'profissional');
    const idioma = config?.idioma || 'pt-BR';
    const instrucoesEspeciais = config?.instrucoes_especiais || '';
    const palavrasProibidas = (config?.palavras_proibidas as string[]) || [];

    let basePrompt = config?.prompt_sistema || 
      `Você é um assistente virtual de uma joalheria. Ajude os clientes com informações sobre produtos, pedidos e pagamentos.`;

    // Check for active A/B test and use variant prompt
    let abTesteId: string | null = null;
    let abVariante: string | null = null;
    try {
      const { data: abTest } = await supabase
        .from('ab_testes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .maybeSingle();

      if (abTest) {
        abVariante = Math.random() < 0.5 ? 'A' : 'B';
        abTesteId = abTest.id;
        
        const variantPrompt = abVariante === 'A' ? abTest.variante_a_prompt : abTest.variante_b_prompt;
        if (variantPrompt) {
          basePrompt = variantPrompt;
        }
        
        const counterField = abVariante === 'A' ? 'variante_a_conversas' : 'variante_b_conversas';
        await supabase
          .from('ab_testes')
          .update({ [counterField]: (abTest[counterField] || 0) + 1 })
          .eq('id', abTest.id);
      }
    } catch (e) {
      console.error('A/B test error:', e);
    }

    // Enrich with organization data
    let knowledgeBase = '';
    try {
      const { data: faqs } = await supabase
        .from('agente_faqs')
        .select('pergunta, resposta')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .limit(30);

      const { data: topProducts } = await supabase
        .from('pecas')
        .select('id, nome, codigo, categoria, preco_venda, descricao, imagem_url, material, estoque')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(30);

      const { data: catalogos } = await supabase
        .from('catalogos')
        .select('id, nome, slug, descricao')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .limit(10);

      if (faqs && faqs.length > 0) {
        knowledgeBase += `\n\n## Base de Conhecimento (FAQs)\n`;
        faqs.forEach((f: any) => {
          knowledgeBase += `P: ${f.pergunta}\nR: ${f.resposta}\n\n`;
        });
      }

      if (topProducts && topProducts.length > 0) {
        knowledgeBase += `\n\n## Catálogo de Produtos (${topProducts.length} peças)\n`;
        topProducts.forEach((p: any) => {
          knowledgeBase += `- [ID:${p.id}] ${p.nome} (${p.codigo || 'N/A'}) R$${p.preco_venda?.toFixed(2) || '?'} | Estoque: ${p.estoque || 0}${p.categoria ? ` | ${p.categoria}` : ''}${p.material ? ` | ${p.material}` : ''}${p.imagem_url ? ' | TEM FOTO' : ''}${p.descricao ? ` | ${p.descricao}` : ''}\n`;
        });
      }

      if (catalogos && catalogos.length > 0) {
        const baseUrl = Deno.env.get('APP_URL') || 'https://nexsiles2567.lovable.app';
        knowledgeBase += `\n\n## Catálogos para Compartilhar\n`;
        catalogos.forEach((c: any) => {
          knowledgeBase += `- "${c.nome}" → ${baseUrl}/catalogo/${c.slug || c.id}${c.descricao ? ` | ${c.descricao}` : ''}\n`;
        });
      }
    } catch (e) {
      console.error('Error enriching prompt:', e);
    }

    // === CLIENT LONG-TERM MEMORY + PREFERENCES ===
    let clientMemory = '';
    try {
      let telefoneCliente = clienteTelefone || null;
      
      if (!telefoneCliente && sessionId) {
        const { data: currentConv } = await supabase
          .from('agente_conversas')
          .select('cliente_telefone, cliente_nome')
          .eq('session_id', sessionId)
          .eq('organization_id', organizationId)
          .maybeSingle();
        if (currentConv?.cliente_telefone) {
          telefoneCliente = currentConv.cliente_telefone;
        }
      }

      if (telefoneCliente) {
        const cleanPhone = telefoneCliente.replace(/\D/g, '');
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        // Fetch client preferences
        const { data: prefs } = await supabase
          .from('cliente_preferencias')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('cliente_telefone', cleanPhone)
          .maybeSingle();

        const { data: pastConversas } = await supabase
          .from('agente_conversas')
          .select('id, created_at, sentimento, lead_score, venda_realizada, valor_venda, produtos_interesse, cliente_nome')
          .eq('organization_id', organizationId)
          .eq('cliente_telefone', telefoneCliente)
          .neq('session_id', sessionId || '__none__')
          .gte('created_at', sixMonthsAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (pastConversas && pastConversas.length > 0) {
          const clienteNome = pastConversas[0].cliente_nome || 'Cliente';
          const totalConversas = pastConversas.length;
          const vendasRealizadas = pastConversas.filter((c: any) => c.venda_realizada).length;
          const valorTotalGasto = pastConversas.reduce((sum: number, c: any) => sum + (c.valor_venda || 0), 0);
          const ultimoContato = new Date(pastConversas[0].created_at).toLocaleDateString('pt-BR');
          const sentimentoRecente = pastConversas[0].sentimento;
          
          const todosInteresses = pastConversas
            .flatMap((c: any) => c.produtos_interesse || [])
            .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
            .slice(0, 10);

          // Fetch last messages from previous conversations
          const conversaIds = pastConversas.slice(0, 3).map((c: any) => c.id);
          const { data: pastMessages } = await supabase
            .from('agente_mensagens')
            .select('content, role, created_at, conversa_id')
            .in('conversa_id', conversaIds)
            .order('created_at', { ascending: false })
            .limit(20);

          let resumoConversas = '';
          if (pastMessages && pastMessages.length > 0) {
            const grouped: Record<string, any[]> = {};
            for (const msg of pastMessages) {
              if (!grouped[msg.conversa_id]) grouped[msg.conversa_id] = [];
              grouped[msg.conversa_id].push(msg);
            }
            
            let convIdx = 0;
            for (const convId of conversaIds) {
              if (convIdx >= 3) break;
              const msgs = grouped[convId];
              if (!msgs || msgs.length === 0) continue;
              const conv = pastConversas.find((c: any) => c.id === convId);
              const dataConv = new Date(conv?.created_at).toLocaleDateString('pt-BR');
              
              const lastMsgs = msgs.slice(0, 4).reverse();
              resumoConversas += `\n### Conversa em ${dataConv}${conv?.venda_realizada ? ' (VENDA - R$' + (conv?.valor_venda || 0).toFixed(2) + ')' : ''}:\n`;
              for (const m of lastMsgs) {
                const prefix = m.role === 'user' ? '👤 Cliente' : '🤖 Agente';
                const content = m.content.length > 150 ? m.content.substring(0, 150) + '...' : m.content;
                resumoConversas += `${prefix}: ${content}\n`;
              }
              convIdx++;
            }
          }

          // Fetch purchase history
          let historicoCompras = '';
          const { data: clienteData } = await supabase
            .from('clientes')
            .select('id, nome, pontos_fidelidade, data_nascimento')
            .eq('organization_id', organizationId)
            .or(`telefone.eq.${telefoneCliente},whatsapp.eq.${telefoneCliente}`)
            .maybeSingle();

          if (clienteData) {
            const { data: compras } = await supabase
              .from('vendas')
              .select('id, numero, valor_total, status, data_venda, created_at')
              .eq('organization_id', organizationId)
              .eq('cliente_id', clienteData.id)
              .order('created_at', { ascending: false })
              .limit(5);

            if (compras && compras.length > 0) {
              historicoCompras = `\n### Compras Anteriores:\n`;
              for (const c of compras) {
                const dataCompra = new Date(c.data_venda || c.created_at).toLocaleDateString('pt-BR');
                historicoCompras += `- Pedido #${c.numero || c.id.toString().slice(0, 8)} em ${dataCompra}: R$ ${(c.valor_total || 0).toFixed(2)} (${c.status})\n`;
              }
            }
            if (clienteData.pontos_fidelidade) {
              historicoCompras += `\n- Pontos de fidelidade: ${clienteData.pontos_fidelidade}\n`;
            }
            if (clienteData.data_nascimento) {
              historicoCompras += `- Aniversário: ${new Date(clienteData.data_nascimento).toLocaleDateString('pt-BR')}\n`;
            }
          }

          // Build preferences section
          let prefsSection = '';
          if (prefs) {
            prefsSection = `\n### Preferências Conhecidas:`;
            if (prefs.categorias_favoritas && (prefs.categorias_favoritas as string[]).length > 0) {
              prefsSection += `\n- Categorias favoritas: ${(prefs.categorias_favoritas as string[]).join(', ')}`;
            }
            if (prefs.materiais_preferidos && (prefs.materiais_preferidos as string[]).length > 0) {
              prefsSection += `\n- Materiais preferidos: ${(prefs.materiais_preferidos as string[]).join(', ')}`;
            }
            if (prefs.faixa_preco_min || prefs.faixa_preco_max) {
              prefsSection += `\n- Faixa de preço: R$ ${prefs.faixa_preco_min || 0} - R$ ${prefs.faixa_preco_max || '∞'}`;
            }
            if (prefs.total_compras) {
              prefsSection += `\n- Total de compras registradas: ${prefs.total_compras} (R$ ${(prefs.valor_total_compras || 0).toFixed(2)})`;
            }
          }

          clientMemory = `

## 🧠 MEMÓRIA DO CLIENTE (USE ESTAS INFORMAÇÕES!)

**Cliente:** ${clienteNome}
**Telefone:** ${telefoneCliente}
**Conversas anteriores:** ${totalConversas}
**Compras via agente:** ${vendasRealizadas} (R$ ${valorTotalGasto.toFixed(2)})
**Último contato:** ${ultimoContato}
**Sentimento recente:** ${sentimentoRecente || 'N/A'}
${todosInteresses.length > 0 ? `**Interesses:** ${todosInteresses.join(', ')}` : ''}
${prefsSection}

### INSTRUÇÕES DE MEMÓRIA:
- NÃO trate como cliente novo. Use o nome naturalmente.
- Referencie compras anteriores: "Da última vez você levou [produto], gostou?"
- Retome interesses não finalizados: "Lembra daquela peça que te interessou?"
- Clientes recorrentes = tratamento VIP.
- USE as preferências conhecidas para sugerir produtos na faixa de preço e categorias que o cliente gosta.
${historicoCompras}
${resumoConversas}`;
        } else if (prefs) {
          // First conversation but we have preferences from other channels
          clientMemory = `

## 🧠 PERFIL DO CLIENTE (dados do sistema)
**Telefone:** ${telefoneCliente}
${prefs.categorias_favoritas ? `**Categorias que gosta:** ${(prefs.categorias_favoritas as string[]).join(', ')}` : ''}
${prefs.total_compras ? `**Compras anteriores:** ${prefs.total_compras} (R$ ${(prefs.valor_total_compras || 0).toFixed(2)})` : ''}
${prefs.ultima_compra_at ? `**Última compra:** ${new Date(prefs.ultima_compra_at as string).toLocaleDateString('pt-BR')}` : ''}

Use essas informações para personalizar o atendimento.`;
        }
      }
    } catch (e) {
      console.error('Error building client memory:', e);
    }

    // Check current cart for the session
    let cartContext = '';
    if (sessionId) {
      const cart = sessionCarts.get(sessionId);
      if (cart && cart.length > 0) {
        const total = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        cartContext = `\n\n## 🛒 CARRINHO ATUAL DO CLIENTE
${cart.map((item, i) => `${i+1}. ${item.nome} x${item.quantidade} = R$ ${(item.preco * item.quantidade).toFixed(2)}`).join('\n')}
**Total: R$ ${total.toFixed(2)}**

O cliente já tem itens no carrinho. Quando ele quiser finalizar, use \`criar_pedido\` com todos os itens do carrinho.`;
      }
    }

    const systemPrompt = `${basePrompt}

${knowledgeBase}

${clientMemory}

${cartContext}

## MODO: AUTONOMIA TOTAL DE VENDAS

Você é um vendedor inteligente com autonomia total. Siga estas diretrizes:

### ⚠️ REGRAS ABSOLUTAS (NUNCA QUEBRE)
1. **NUNCA repita saudações ou frases parecidas.** Se já cumprimentou, vá direto ao ponto.
2. **NUNCA invente horários de funcionamento.** Você atende 24 horas, 7 dias por semana. NUNCA diga "estamos fora do horário".
3. **NUNCA responda perguntas sobre produtos sem usar ferramentas.** Se o cliente pedir anéis, brincos, fotos, preços → OBRIGATORIAMENTE use \`buscar_produtos\` PRIMEIRO.
4. **NUNCA dê uma resposta genérica quando o cliente pedir algo específico.** Use as ferramentas disponíveis.
5. **NUNCA repita "como posso te ajudar" ou "o que está procurando" se o cliente JÁ disse o que quer.**

### 🎯 Objetivo Principal
Seu objetivo é VENDER. Cada conversa é uma oportunidade. Seja proativo, sugira produtos, ofereça catálogos e feche vendas.

### 📋 Fluxo de Vendas Autônomo
1. **Saudação** → Cumprimente UMA VEZ APENAS e pergunte o que o cliente procura
2. **Descoberta** → Entenda a necessidade (presente? uso pessoal? ocasião?)
3. **Apresentação** → Use \`buscar_produtos\` para encontrar peças relevantes. SEMPRE envie a foto junto com descrição e preço usando \`enviar_foto_produto\`
4. **Carrinho** → Quando o cliente gostar de uma peça, use \`gerenciar_carrinho\` para adicionar. Permita que ele monte o pedido completo.
5. **Upsell** → Após o cliente demonstrar interesse, use \`sugerir_complementos\` para oferecer peças que combinam!
6. **Catálogo** → Quando apropriado, envie o link do catálogo com \`gerar_link_catalogo\`
7. **Objeções** → Responda dúvidas sobre material, qualidade, preço
8. **Fechamento** → Quando o cliente tiver itens no carrinho, pergunte "Posso finalizar seu pedido?"
9. **Pagamento** → Use \`gerar_pix\` quando confirmar a compra
10. **Pedido** → Use \`criar_pedido\` para registrar no sistema (inclua TODOS os itens do carrinho)

### 🛒 CARRINHO INTELIGENTE
- Quando o cliente gostar de uma peça, ADICIONE ao carrinho automaticamente com \`gerenciar_carrinho\`
- Permita que o cliente continue navegando e adicionando mais itens
- Mostre o resumo do carrinho quando ele perguntar ou antes de fechar
- Quando o cliente disser "quero fechar", "finalizar", "é isso" → mostre o carrinho e confirme o pedido
- Se o cliente remover um item, confirme e sugira outra peça no lugar

### 💡 UPSELL INTELIGENTE (OBRIGATÓRIO)
- Após CADA produto que o cliente demonstrar interesse, use \`sugerir_complementos\` para recomendar peças que combinam
- Frases de upsell: "Essa peça fica LINDA com..." / "Muitas clientes levam junto..." / "Que tal completar o look?"
- Se o cliente comprou/gostou de um anel → sugira pulseira ou brinco
- Se o cliente comprou/gostou de um colar → sugira brinco ou pingente
- SEMPRE apresente 2-3 sugestões complementares com foto

### 🔧 QUANDO USAR FERRAMENTAS (OBRIGATÓRIO)
Você DEVE chamar ferramentas nestas situações - NUNCA responda sem usá-las:
- Cliente menciona QUALQUER tipo de produto → \`buscar_produtos\`
- Cliente pede foto, imagem, "me mostra" → \`buscar_produtos\` + inclua IMAGEM_URL na resposta
- Cliente pergunta preço → \`buscar_produtos\`
- Cliente gosta de uma peça / diz "quero", "gostei", "adiciona" → \`gerenciar_carrinho\` (adicionar)
- Cliente pergunta "meu carrinho", "o que tenho" → \`gerenciar_carrinho\` (ver)
- Cliente quer comprar / finalizar → \`criar_pedido\`
- Cliente quer pagar → \`gerar_pix\`
- Após mostrar um produto → \`sugerir_complementos\` para upsell

### 📸 REGRA CRÍTICA DE ENVIO DE PRODUTOS (WhatsApp)
Quando o atendimento for via WhatsApp e você apresentar qualquer produto:
1. SEMPRE use \`buscar_produtos\` primeiro para encontrar peças reais
2. Na resposta, INCLUA as informações do produto com IMAGEM_URL para que o webhook envie a foto
3. O formato deve incluir: nome, descrição, preço e a URL da imagem (IMAGEM_URL: url)
4. Se houver múltiplos produtos, apresente cada um com sua IMAGEM_URL
5. NUNCA apresente um produto sem buscar na base de dados primeiro
6. Se o produto não tem foto, informe: "Esta peça não possui foto no momento, mas posso descrever..."

### 🧠 Comportamento Inteligente
- SEMPRE busque produtos reais antes de recomendar (use \`buscar_produtos\`)
- SEMPRE inclua IMAGEM_URL dos produtos na resposta para envio via WhatsApp
- Sugira produtos complementares (upsell/cross-sell) AUTOMATICAMENTE após cada interesse
- Se o cliente perguntar algo genérico ("o que vocês têm?"), mostre destaques com fotos e envie o catálogo
- Use os IDs reais dos produtos nas ferramentas
- Nunca invente produtos ou preços - sempre consulte a base de dados
- Informe sobre estoque: "Últimas X unidades!" para criar urgência quando apropriado

### 🔥 Qualificação de Leads (IMPORTANTE)
Classifique mentalmente o cliente durante a conversa:
- **QUENTE**: Perguntou preço, pediu foto, mencionou compra, respondeu rápido → tente fechar a venda
- **MORNO**: Navegando, perguntando sobre produtos, indeciso → envie catálogo, sugira opções
- **FRIO**: Apenas curiosidade, sem intenção clara → seja gentil, envie catálogo, deixe porta aberta

### 🔄 Reengajamento
- Se o cliente parar de responder após mostrar interesse: "Oi! Ainda estou aqui caso queira finalizar 😊"
- Se pediu foto/preço mas não avançou: "Essa peça está saindo rápido! Quer que eu reserve para você?"
- Após venda: "Obrigado pela compra! Se precisar de algo mais, estou aqui!"

### 💬 Compartilhamento de Catálogos
- Sempre que fizer sentido, envie o link do catálogo ao cliente
- Diga "Preparei nosso catálogo completo para você" e envie o link
- Se o cliente não sabe o que quer, envie o catálogo como ponto de partida

### 🚫 Limites
- **NUNCA dê descontos, promoções ou reduza preços.** O preço que está no sistema é o preço final. Se o cliente pedir desconto, diga educadamente: "Nossos preços já são especiais e estão com o melhor valor possível! 😊"
- Não invente informações, preços ou produtos
- Não prometa prazos de entrega sem informação real
- Se não souber algo, diga que vai verificar ou transfira para humano
- Respeite o cliente se ele não quiser comprar

### 📧 E-mails Automáticos (use \`enviar_email_automatico\`)
Envie e-mails automaticamente nas seguintes ocasiões:
- **confirmacao_pedido**: SEMPRE após criar um pedido com sucesso → pergunte o e-mail do cliente antes
- **follow_up**: Após resolver um problema/dúvida complexa → "Posso enviar um resumo por e-mail?"
- **marketing**: Quando o cliente demonstrar interesse mas não comprar → "Posso enviar nossas promoções por e-mail?"
- **geral (boas-vindas)**: Para novos clientes que fornecem e-mail → envie boas-vindas automaticamente
- **resumo_conversa**: Quando o cliente pedir explicitamente um resumo por e-mail

IMPORTANTE: Sempre pergunte o e-mail do cliente antes de enviar. Se ele já forneceu, use-o diretamente.

## Tom de Comunicação
${toneInstructions}

## Idioma
Responda sempre em ${idioma === 'pt-BR' ? 'português brasileiro' : idioma === 'en-US' ? 'inglês' : 'espanhol'}.

${instrucoesEspeciais ? `## Instruções Especiais\n${instrucoesEspeciais}\n` : ''}

${palavrasProibidas.length > 0 ? `## Palavras a Evitar\nNunca use estas palavras ou termos: ${palavrasProibidas.join(', ')}\n` : ''}`;

    const makeAiCall = async () => {
      return await fetch(aiBaseUrl, {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({
          model: aiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          tools: activeTools.length > 0 ? activeTools : undefined,
          tool_choice: activeTools.length > 0 ? 'auto' : undefined,
          temperature: config?.temperatura || 0.7,
          max_tokens: config?.max_tokens || 1024
        })
      });
    };

    let aiResponse = await makeAiCall();




    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error('AI error:', status, errorText);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Por favor, aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await aiResponse.json();
    let assistantMessage = aiData.choices?.[0]?.message;

    // Handle tool calls
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log('Tool calls detected:', assistantMessage.tool_calls.length);
      
      const toolResults: { role: string; tool_call_id: string; content: string }[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        
        const result = await executarTool(toolName, toolArgs, supabase, organizationId, config || {}, sessionId);
        
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result
        });
      }

      // Small delay to avoid rate limiting on second call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Clean assistant message for follow-up
      const cleanAssistantMsg: Record<string, unknown> = {
        role: 'assistant',
        tool_calls: assistantMessage.tool_calls,
      };
      if (assistantMessage.content) {
        cleanAssistantMsg.content = assistantMessage.content;
      }

      // Second AI call with tool results
      console.log('Making follow-up call with', toolResults.length, 'tool results');
      const followUpResponse = await fetch(aiBaseUrl, {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({
          model: aiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            cleanAssistantMsg,
            ...toolResults
          ],
          temperature: 0.7,
          max_tokens: config?.max_tokens || 1024
        })
      });

      if (!followUpResponse.ok) {
        const followUpError = await followUpResponse.text();
        console.error('Follow-up AI error:', followUpResponse.status, followUpError);
        const fallbackContent = toolResults.map(r => r.content).join('\n\n');
        return new Response(JSON.stringify({
          content: fallbackContent || 'Desculpe, houve um erro ao processar. Tente novamente.',
          role: 'assistant'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const followUpData = await followUpResponse.json();
      console.log('Follow-up response received:', !!followUpData.choices?.[0]?.message?.content);
      assistantMessage = followUpData.choices?.[0]?.message;
    }

    // Analyze sentiment of user message
    const lastUserMessage = messages[messages.length - 1];
    let sentimento: string | null = null;
    try {
      const sentimentResponse = await fetch(aiBaseUrl, {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Classify the sentiment of the user message as exactly one word: positivo, neutro, or negativo. Reply with only that one word.' },
            { role: 'user', content: lastUserMessage.content }
          ],
          max_tokens: 10,
          temperature: 0
        })
      });
      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json();
        const raw = (sentimentData.choices?.[0]?.message?.content || '').trim().toLowerCase();
        if (['positivo', 'neutro', 'negativo'].includes(raw)) {
          sentimento = raw;
        }
      }
    } catch (e) {
      console.error('Sentiment analysis error:', e);
    }

    // Determine lead score based on conversation content
    let leadScore = 'frio';
    const allContent = messages.map((m: any) => m.content).join(' ').toLowerCase();
    const hotKeywords = ['comprar', 'preço', 'quanto custa', 'pix', 'pedido', 'quero', 'reservar', 'separar', 'fechar', 'pagar', 'carrinho', 'finalizar'];
    const warmKeywords = ['catálogo', 'foto', 'ver', 'opções', 'disponível', 'tem', 'modelo', 'material', 'gostei', 'bonito'];
    
    const hotMatches = hotKeywords.filter(k => allContent.includes(k)).length;
    const warmMatches = warmKeywords.filter(k => allContent.includes(k)).length;
    
    if (hotMatches >= 2) leadScore = 'quente';
    else if (hotMatches >= 1 || warmMatches >= 2) leadScore = 'morno';

    // Detect if a sale was made
    const vendaRealizada = assistantMessage?.content?.includes('Pedido criado com sucesso') || false;
    let valorVenda = 0;
    if (vendaRealizada) {
      const match = assistantMessage?.content?.match(/R\$\s*([\d.,]+)/);
      if (match) {
        valorVenda = parseFloat(match[1].replace('.', '').replace(',', '.'));
      }
    }

    // Extract products of interest
    const produtosInteresse: string[] = [];
    
    // Save conversation to database if sessionId provided
    if (sessionId) {
      try {
        let { data: conversa } = await supabase
          .from('agente_conversas')
          .select('id')
          .eq('session_id', sessionId)
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (!conversa) {
          const { data: newConversa } = await supabase
            .from('agente_conversas')
            .insert({
              session_id: sessionId,
              organization_id: organizationId,
              sentimento,
              ab_teste_id: abTesteId,
              ab_variante: abVariante,
              lead_score: leadScore,
              venda_realizada: vendaRealizada,
              valor_venda: valorVenda,
              ultimo_contato_at: new Date().toISOString(),
              produtos_interesse: produtosInteresse.length > 0 ? produtosInteresse : null,
            })
            .select('id')
            .single();
          conversa = newConversa;
        } else {
          const updateData: Record<string, any> = {
            sentimento,
            sentimento_score: sentimento === 'positivo' ? 1 : sentimento === 'negativo' ? -1 : 0,
            lead_score: leadScore,
            ultimo_contato_at: new Date().toISOString(),
          };
          if (vendaRealizada) {
            updateData.venda_realizada = true;
            updateData.valor_venda = valorVenda;
            updateData.status = 'finalizada';
            updateData.closed_at = new Date().toISOString();
          }
          await supabase
            .from('agente_conversas')
            .update(updateData)
            .eq('id', conversa.id);
        }

        if (conversa) {
          await supabase.from('agente_mensagens').insert([
            { conversa_id: conversa.id, role: 'user', content: lastUserMessage.content, sentimento },
            { conversa_id: conversa.id, role: 'assistant', content: assistantMessage?.content || '' }
          ]);
        }
      } catch (error) {
        console.error('Error saving conversation:', error);
      }
    }

    return new Response(JSON.stringify({
      content: assistantMessage?.content || 'Desculpe, não consegui processar sua mensagem.',
      role: 'assistant'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Agent error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
