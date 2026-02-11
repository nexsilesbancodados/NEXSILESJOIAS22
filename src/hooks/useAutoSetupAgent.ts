import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEFAULT_CONFIG = {
  nome_agente: 'Consultora de Joias',
  prompt_sistema: `Você é uma consultora de vendas especializada em joias e semijoias. Seu objetivo principal é VENDER.

REGRAS DE OURO:
1. SEMPRE busque produtos reais no estoque antes de recomendar
2. Envie fotos quando o cliente demonstrar interesse
3. Sugira combinações (cross-sell): "Esse colar combina com esses brincos!"
4. Crie urgência com estoque baixo: "Últimas unidades!"
5. Feche proativamente: "Posso separar para você? Aceita PIX?"
6. Gere PIX automaticamente quando confirmar a compra
7. Pergunte a ocasião para personalizar sugestões
8. Seja elegante, atenciosa e crie experiência premium
9. Use emojis com moderação para criar proximidade
10. Se não souber resolver, transfira para atendente humano`,
  cor_primaria: '#D4AF37',
  mensagem_boas_vindas: '✨ Olá! Sou sua consultora de joias. Posso ajudar você a encontrar a peça perfeita! Qual a ocasião especial?',
  ativo: true,
  pix_tipo: 'email',
  tom_resposta: 'amigavel',
  idioma: 'pt-BR',
  max_tokens: 1024,
  temperatura: 0.7,
  ferramentas_ativas: {
    consultar_estoque: true,
    buscar_pecas: true,
    gerar_pix: true,
    enviar_whatsapp: true,
    listar_catalogos: true,
    criar_pedido: true,
    verificar_pedido: true,
  },
  horario_funcionamento: {
    ativo: false,
    inicio: '09:00',
    fim: '18:00',
    dias: [1, 2, 3, 4, 5],
    mensagem_fora: 'Nosso atendimento funciona de segunda a sexta, das 9h às 18h. Deixe sua mensagem que respondemos assim que possível! 😊',
  },
  respostas_rapidas: [],
  palavras_proibidas: [],
  limite_mensagens_sessao: 50,
};

const DEFAULT_AGENTS = [
  {
    nome: 'Vendedor Expert',
    departamento: 'vendas',
    cor: '#22c55e',
    palavras_chave: ['comprar', 'preço', 'quanto', 'valor', 'promoção', 'desconto', 'catálogo', 'produto', 'peça', 'anel', 'colar', 'pulseira', 'brinco'],
    prompt_sistema: `Você é um vendedor especialista em joias e semijoias. Seu objetivo é VENDER.
Regras:
- Sempre busque produtos reais antes de recomendar
- Envie fotos quando o cliente demonstrar interesse
- Sugira produtos complementares: "Esse colar combina perfeitamente com esses brincos!"
- Crie urgência quando o estoque for baixo: "Últimas unidades!"
- Ofereça o catálogo quando o cliente estiver indeciso
- Feche a venda proativamente: "Posso separar para você?"
- Gere PIX quando confirmar a compra
- Seja entusiasmado e use emojis com moderação`,
    ordem_prioridade: 0,
    ativo: true,
  },
  {
    nome: 'Atendente Suporte',
    departamento: 'suporte',
    cor: '#3b82f6',
    palavras_chave: ['problema', 'defeito', 'troca', 'devolução', 'reclamação', 'quebrou', 'errado', 'ajuda', 'suporte', 'garantia'],
    prompt_sistema: `Você é um atendente de suporte empático e resolutivo.
Regras:
- Ouça o cliente com atenção antes de responder
- Peça detalhes sobre o problema (fotos, número do pedido)
- Ofereça soluções claras: troca, devolução ou reparo
- Se não puder resolver, transfira para humano com contexto completo
- Nunca discuta com o cliente
- Priorize a satisfação do cliente`,
    ordem_prioridade: 1,
    ativo: true,
  },
  {
    nome: 'Consultor de Estilo',
    departamento: 'vendas',
    cor: '#ec4899',
    palavras_chave: ['presente', 'ocasião', 'combinar', 'estilo', 'tendência', 'moda', 'casamento', 'formatura', 'aniversário', 'look'],
    prompt_sistema: `Você é um consultor de estilo especializado em joias e acessórios.
Regras:
- Pergunte sobre a ocasião (casamento, formatura, dia a dia, presente)
- Entenda o estilo pessoal (clássico, moderno, minimalista)
- Sugira combinações harmoniosas de peças
- Monte looks completos com peças que combinam entre si
- Sempre busque produtos reais da base de dados
- Envie fotos das sugestões`,
    ordem_prioridade: 2,
    ativo: true,
  },
  {
    nome: 'Agente Financeiro',
    departamento: 'financeiro',
    cor: '#eab308',
    palavras_chave: ['pagamento', 'pix', 'parcelar', 'boleto', 'nota fiscal', 'comprovante', 'parcela', 'condição'],
    prompt_sistema: `Você é o agente financeiro responsável por pagamentos e cobranças.
Regras:
- Gere PIX quando o cliente confirmar a compra
- Informe claramente as condições de pagamento
- Confirme recebimento de comprovantes
- Registre pedidos corretamente no sistema
- Seja preciso com valores e condições`,
    ordem_prioridade: 3,
    ativo: true,
  },
  {
    nome: 'Recepcionista Digital',
    departamento: 'geral',
    cor: '#64748b',
    palavras_chave: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'horário', 'endereço', 'localização', 'funcionamento'],
    prompt_sistema: `Você é a recepcionista digital, primeiro contato com o cliente.
Regras:
- Cumprimente calorosamente e pergunte como pode ajudar
- Identifique a necessidade do cliente rapidamente
- Encaminhe para o agente correto (vendas, suporte, financeiro)
- Informe horários de funcionamento e localização
- Se o cliente quiser comprar, envie o catálogo como ponto de partida
- Seja sempre simpática e profissional`,
    ordem_prioridade: 10,
    ativo: true,
  },
];

const DEFAULT_FAQS = [
  { pergunta: 'Qual o prazo de entrega?', resposta: 'O prazo de entrega varia de 3 a 7 dias úteis após a confirmação do pagamento, dependendo da sua região. Enviamos pelos Correios com rastreio.', categoria: 'Entrega', palavras_chave: ['prazo', 'entrega', 'demora', 'chegar', 'dias'] },
  { pergunta: 'Vocês fazem entrega para todo o Brasil?', resposta: 'Sim! Enviamos para todo o Brasil pelos Correios (PAC e SEDEX). O valor do frete é calculado de acordo com o CEP de destino.', categoria: 'Entrega', palavras_chave: ['entrega', 'brasil', 'frete', 'envio'] },
  { pergunta: 'Como rastrear meu pedido?', resposta: 'Assim que seu pedido for postado, enviaremos o código de rastreio por WhatsApp e e-mail. Você pode acompanhar no site dos Correios.', categoria: 'Entrega', palavras_chave: ['rastrear', 'rastreio', 'rastreamento', 'código'] },
  { pergunta: 'Quais formas de pagamento vocês aceitam?', resposta: 'Aceitamos PIX (desconto à vista), cartão de crédito, cartão de débito e boleto bancário.', categoria: 'Pagamento', palavras_chave: ['pagamento', 'pagar', 'pix', 'cartão', 'boleto'] },
  { pergunta: 'Vocês parcelam?', resposta: 'Sim! Parcelamos em até 12x no cartão de crédito. Para compras acima de R$ 200, o parcelamento é sem juros em até 3x.', categoria: 'Pagamento', palavras_chave: ['parcelar', 'parcela', 'vezes', 'dividir'] },
  { pergunta: 'Como funciona o pagamento por PIX?', resposta: 'Após confirmar seu pedido, geramos uma chave PIX para pagamento. Basta copiar e colar no app do seu banco. O pagamento é confirmado instantaneamente!', categoria: 'Pagamento', palavras_chave: ['pix', 'chave', 'qrcode', 'transferência'] },
  { pergunta: 'As peças são banhadas ou folheadas?', resposta: 'Trabalhamos com diversas opções: peças banhadas a ouro 18k, folheadas, prata 925 e aço inoxidável. Cada produto tem a especificação detalhada no catálogo.', categoria: 'Produtos', palavras_chave: ['banhada', 'folheada', 'ouro', 'prata', 'material'] },
  { pergunta: 'As peças escurecem?', resposta: 'Nossas peças banhadas a ouro têm alta durabilidade! Para manter o brilho, evite contato com perfumes, cremes e produtos químicos.', categoria: 'Produtos', palavras_chave: ['escurecer', 'manchar', 'durabilidade', 'cuidado'] },
  { pergunta: 'Vocês têm garantia?', resposta: 'Sim! Todas as nossas peças possuem garantia de 90 dias contra defeitos de fabricação.', categoria: 'Produtos', palavras_chave: ['garantia', 'defeito', 'qualidade'] },
  { pergunta: 'Posso ver fotos reais das peças?', resposta: 'Claro! Posso enviar fotos reais de qualquer peça que te interessar. Me diz qual produto gostaria de ver! 📸', categoria: 'Produtos', palavras_chave: ['foto', 'imagem', 'real', 'ver'] },
  { pergunta: 'Como faço para trocar uma peça?', resposta: 'Você tem até 7 dias após o recebimento para solicitar troca. A peça deve estar sem uso e na embalagem original. O frete de retorno fica por nossa conta!', categoria: 'Trocas', palavras_chave: ['trocar', 'troca', 'devolver', 'devolução'] },
  { pergunta: 'E se a peça chegar com defeito?', resposta: 'Se a peça chegou com defeito, envie fotos por WhatsApp e faremos a troca imediata sem custo adicional.', categoria: 'Trocas', palavras_chave: ['defeito', 'quebrada', 'danificada', 'problema'] },
  { pergunta: 'Como funciona para ser revendedora?', resposta: 'Para ser revendedora, basta entrar em contato! Oferecemos maletas com peças selecionadas, preços especiais de revenda e suporte completo. Sem taxa de adesão!', categoria: 'Revenda', palavras_chave: ['revendedora', 'revender', 'revenda', 'maleta'] },
  { pergunta: 'Qual a comissão das revendedoras?', resposta: 'Nossas revendedoras trabalham com margem de lucro de 30% a 50% sobre o preço de revenda. Quanto mais vender, maior seu lucro!', categoria: 'Revenda', palavras_chave: ['comissão', 'lucro', 'margem', 'ganho'] },
  { pergunta: 'Qual o horário de atendimento?', resposta: 'Nosso atendimento funciona de segunda a sexta, das 9h às 18h, e aos sábados das 9h às 13h. Fora desse horário, deixe sua mensagem!', categoria: 'Geral', palavras_chave: ['horário', 'atendimento', 'funcionar'] },
  { pergunta: 'Como entro em contato?', resposta: 'Você pode falar comigo aqui mesmo! Também atendemos pelo WhatsApp e e-mail. Estou à disposição! 😊', categoria: 'Geral', palavras_chave: ['contato', 'falar', 'telefone', 'whatsapp'] },
];

export function useAutoSetupAgent(organizationId: string) {
  const queryClient = useQueryClient();
  const setupRan = useRef(false);

  const { data: setupStatus, isLoading } = useQuery({
    queryKey: ['agent-setup-status', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const [configRes, agentsRes, faqsRes] = await Promise.all([
        supabase.from('agente_ia_config').select('id').eq('organization_id', organizationId).maybeSingle(),
        supabase.from('agentes').select('id').eq('organization_id', organizationId).limit(1),
        supabase.from('agente_faqs').select('id').eq('organization_id', organizationId).limit(1),
      ]);

      return {
        hasConfig: !!configRes.data,
        hasAgents: (agentsRes.data?.length || 0) > 0,
        hasFaqs: (faqsRes.data?.length || 0) > 0,
      };
    },
    enabled: !!organizationId,
  });

  useEffect(() => {
    if (!organizationId || !setupStatus || setupRan.current || isLoading) return;
    
    const needsSetup = !setupStatus.hasConfig || !setupStatus.hasAgents || !setupStatus.hasFaqs;
    if (!needsSetup) return;

    setupRan.current = true;

    const runSetup = async () => {
      try {
        const promises: PromiseLike<any>[] = [];

        if (!setupStatus.hasConfig) {
          promises.push(
            supabase.from('agente_ia_config').insert({
              ...DEFAULT_CONFIG,
              organization_id: organizationId,
              ferramentas_ativas: DEFAULT_CONFIG.ferramentas_ativas as any,
              horario_funcionamento: DEFAULT_CONFIG.horario_funcionamento as any,
              respostas_rapidas: DEFAULT_CONFIG.respostas_rapidas as any,
            } as any).select().then(r => r)
          );
        }

        if (!setupStatus.hasAgents) {
          const agentsToInsert = DEFAULT_AGENTS.map(a => ({
            ...a,
            organization_id: organizationId,
          }));
          promises.push(supabase.from('agentes').insert(agentsToInsert).select().then(r => r));
        }

        if (!setupStatus.hasFaqs) {
          const faqsToInsert = DEFAULT_FAQS.map(f => ({
            ...f,
            organization_id: organizationId,
            ativo: true,
          }));
          promises.push(supabase.from('agente_faqs').insert(faqsToInsert).select().then(r => r));
        }

        await Promise.all(promises);

        queryClient.invalidateQueries({ queryKey: ['agent-config'] });
        queryClient.invalidateQueries({ queryKey: ['agentes'] });
        queryClient.invalidateQueries({ queryKey: ['faqs'] });
        queryClient.invalidateQueries({ queryKey: ['agent-setup-status'] });

        toast.success('🚀 Agente configurado automaticamente! Só falta conectar o WhatsApp.');
      } catch (err) {
        console.error('Auto-setup error:', err);
      }
    };

    runSetup();
  }, [organizationId, setupStatus, isLoading, queryClient]);

  return {
    isReady: setupStatus ? setupStatus.hasConfig && setupStatus.hasAgents && setupStatus.hasFaqs : false,
    isLoading,
  };
}
