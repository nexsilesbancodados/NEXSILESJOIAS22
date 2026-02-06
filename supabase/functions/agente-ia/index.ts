import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Tool definitions for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "buscar_produtos",
      description: "Busca produtos/peças no catálogo por nome, código, categoria ou faixa de preço. Use para responder perguntas sobre disponibilidade, preços e detalhes de produtos.",
      parameters: {
        type: "object",
        properties: {
          termo: { type: "string", description: "Termo de busca (nome, código ou categoria)" },
          categoria: { type: "string", description: "Filtrar por categoria específica" },
          preco_max: { type: "number", description: "Preço máximo" },
          preco_min: { type: "number", description: "Preço mínimo" },
          limite: { type: "number", description: "Número máximo de resultados (padrão 5)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "listar_catalogos",
      description: "Lista os catálogos disponíveis para compartilhar com clientes.",
      parameters: {
        type: "object",
        properties: {
          ativo: { type: "boolean", description: "Filtrar apenas catálogos ativos" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "gerar_link_catalogo",
      description: "Gera um link de compartilhamento para um catálogo específico.",
      parameters: {
        type: "object",
        properties: {
          catalogo_id: { type: "string", description: "ID do catálogo" }
        },
        required: ["catalogo_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "gerar_pix",
      description: "Gera informações de pagamento PIX para um valor específico. Use quando o cliente quiser finalizar uma compra.",
      parameters: {
        type: "object",
        properties: {
          valor: { type: "number", description: "Valor do PIX em reais" },
          descricao: { type: "string", description: "Descrição do pagamento" }
        },
        required: ["valor"]
      }
    }
  },
  {
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
  },
  {
    type: "function",
    function: {
      name: "criar_pedido",
      description: "Cria um novo pedido no sistema. Use quando o cliente confirmar a compra.",
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
  },
  {
    type: "function",
    function: {
      name: "enviar_whatsapp",
      description: "Envia uma mensagem via WhatsApp para o cliente usando a Evolution API. Use quando precisar enviar catálogos, confirmações de pedidos ou mensagens para clientes.",
      parameters: {
        type: "object",
        properties: {
          telefone: { type: "string", description: "Número do telefone (com DDD, ex: 11999999999)" },
          mensagem: { type: "string", description: "Mensagem a ser enviada" }
        },
        required: ["telefone", "mensagem"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "enviar_whatsapp_midia",
      description: "Envia uma imagem ou arquivo via WhatsApp para o cliente. Use para enviar fotos de produtos.",
      parameters: {
        type: "object",
        properties: {
          telefone: { type: "string", description: "Número do telefone (com DDD)" },
          midia_url: { type: "string", description: "URL da imagem ou arquivo" },
          legenda: { type: "string", description: "Legenda da mídia (opcional)" }
        },
        required: ["telefone", "midia_url"]
      }
    }
  }
];

// Tool execution functions
async function executarTool(
  toolName: string, 
  args: Record<string, unknown>, 
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  config: Record<string, unknown>
): Promise<string> {
  console.log(`Executing tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      case "buscar_produtos": {
        let query = supabase
          .from('pecas')
          .select('id, nome, codigo, categoria, preco_venda, preco_revenda, estoque, imagem_url, descricao')
          .eq('organization_id', organizationId)
          .eq('ativo', true)
          .limit(args.limite as number || 5);

        if (args.termo) {
          query = query.or(`nome.ilike.%${args.termo}%,codigo.ilike.%${args.termo}%`);
        }
        if (args.categoria) {
          query = query.eq('categoria', args.categoria);
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
          return "Nenhum produto encontrado com os critérios informados.";
        }

        return `Encontrei ${data.length} produto(s):\n` + data.map((p: Record<string, unknown>) => 
          `• ${p.nome} (Cód: ${p.codigo || 'N/A'}) - R$ ${(p.preco_venda as number)?.toFixed(2) || 'Consultar'} - Estoque: ${p.estoque || 0} unidades${p.categoria ? ` - Categoria: ${p.categoria}` : ''}`
        ).join('\n');
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
          return "É necessário informar pelo menos um item para criar o pedido.";
        }

        // Get pieces info
        const pecaIds = itens.map(i => i.peca_id);
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
        
        for (const item of itens) {
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
        const vendaItens = itens.map(item => {
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

        return `✅ **Pedido criado com sucesso!**

**Número do pedido:** #${venda.numero || venda.id.toString().slice(0, 8)}
**Cliente:** ${args.cliente_nome}
**Valor total:** R$ ${subtotal.toFixed(2)}
**Status:** Pendente

O pedido foi registrado e será processado em breve!`;
      }

      case "enviar_whatsapp": {
        const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
        const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
        
        if (!evolutionUrl || !evolutionKey) {
          // Fallback to WhatsApp link if Evolution API not configured
          const telefone = (args.telefone as string).replace(/\D/g, '');
          const mensagem = encodeURIComponent(args.mensagem as string);
          const link = `https://wa.me/55${telefone}?text=${mensagem}`;
          return `📱 Evolution API não configurada. Use este link:\n${link}`;
        }
        
        let telefone = (args.telefone as string).replace(/\D/g, '');
        // Ensure phone has country code
        if (!telefone.startsWith('55')) {
          telefone = '55' + telefone;
        }
        
        try {
          // Get the default instance name (usually the first one or from config)
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
          // Fallback to link
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
    const { messages, organizationId, sessionId } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    const systemPrompt = config?.prompt_sistema || 
      `Você é um assistente virtual de uma joalheria. Ajude os clientes com informações sobre produtos, pedidos e pagamentos.
      
Seja sempre educado, prestativo e profissional. Use emojis com moderação para tornar a conversa mais agradável.

Você tem acesso a ferramentas para:
- Buscar produtos no catálogo
- Listar e compartilhar catálogos
- Gerar informações de pagamento PIX
- Consultar e criar pedidos
- Enviar mensagens via WhatsApp

Sempre que possível, use as ferramentas disponíveis para fornecer informações precisas e atualizadas.`;

    // First AI call with tools
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', status, errorText);
      
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
      throw new Error(`AI Gateway error: ${status}`);
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
        
        const result = await executarTool(toolName, toolArgs, supabase, organizationId, config || {});
        
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result
        });
      }

      // Second AI call with tool results
      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            assistantMessage,
            ...toolResults
          ],
          temperature: 0.7
        })
      });

      if (!followUpResponse.ok) {
        console.error('Follow-up AI error:', await followUpResponse.text());
        // Return tool results directly if follow-up fails
        return new Response(JSON.stringify({
          content: toolResults.map(r => r.content).join('\n\n'),
          tool_results: toolResults
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const followUpData = await followUpResponse.json();
      assistantMessage = followUpData.choices?.[0]?.message;
    }

    // Save conversation to database if sessionId provided
    if (sessionId) {
      try {
        // Get or create conversation
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
              organization_id: organizationId
            })
            .select('id')
            .single();
          conversa = newConversa;
        }

        if (conversa) {
          // Save the last user message and assistant response
          const lastUserMessage = messages[messages.length - 1];
          await supabase.from('agente_mensagens').insert([
            { conversa_id: conversa.id, role: 'user', content: lastUserMessage.content },
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
