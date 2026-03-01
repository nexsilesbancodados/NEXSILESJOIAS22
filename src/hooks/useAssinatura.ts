import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/supabase-db';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Assinatura {
  id: string;
  user_id: string;
  plano: 'nexsiles' | 'nexsiles_ysis' | 'nexsiles_commerce';
  status: 'ativo' | 'expirado' | 'cancelado' | 'pendente';
  data_inicio: string;
  data_vencimento: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  valor_mensal: number;
  notificacao_3dias_enviada: boolean;
  notificacao_vencimento_enviada: boolean;
  created_at: string;
  updated_at: string;
  trial_ativo?: boolean;
  trial_iniciado_em?: string;
  trial_dias?: number;
  metodo_pagamento?: 'pix' | 'boleto' | 'cartao';
  pagamento_recorrente?: boolean;
  ultimo_pagamento_em?: string;
  proximo_pagamento_em?: string;
  mercadopago_preference_id?: string;
  mercadopago_payment_id?: string;
}

export interface NotificacaoAssinatura {
  id: string;
  user_id: string;
  tipo: 'aviso_3dias' | 'aviso_vencimento' | 'expirado';
  titulo: string;
  mensagem: string;
  lida: boolean;
  email_enviado: boolean;
  created_at: string;
}

export const PLANOS = {
  nexsiles: {
    nome: 'Nexsiles',
    tier: 'PRATA',
    descricao: 'Gestão completa para seu negócio de semijoias',
    recursos: [
      'Dashboard inteligente',
      'PDV completo',
      'Estoque ilimitado',
      'Cadastro de revendedoras',
      'Catálogos digitais',
      'Relatórios completos',
      'Sistema de fidelidade',
      'Integração WhatsApp',
    ],
    valor: 189.00,
  },
  nexsiles_ysis: {
    nome: 'Nexsiles Ysis',
    tier: 'OURO',
    descricao: 'Vendas potencializadas com inteligência artificial',
    recursos: [
      'Tudo do plano Prata',
      'Assistente IA WhatsApp',
      'Chatbot integrado 24/7',
      'Respostas automáticas',
      'Sugestões de vendas por IA',
      'Análise preditiva de estoque',
      'Atendimento automático',
      'Relatórios de IA',
    ],
    valor: 249.00,
    badges: ['IA 24/7'],
  },
  nexsiles_commerce: {
    nome: 'Nexsiles Commerce',
    tier: 'DIAMANTE',
    descricao: 'Loja virtual + IA + gestão total',
    recursos: [
      'Tudo do plano Ouro',
      'Loja virtual com domínio',
      'Checkout Pix, Cartão, Boleto',
      'Carrinho com cupons',
      'Gestão de pedidos',
      'Cálculo de frete',
      'SEO otimizado',
      'Campanhas e promoções',
    ],
    valor: 299.00,
    badges: ['Loja Virtual', 'IA'],
  },
} as const;

export type PlanoKey = keyof typeof PLANOS;

export function useAssinatura() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assinatura, isLoading, error } = useQuery({
    queryKey: ['assinatura', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: ownSub, error: ownError } = await db
        .from('assinaturas')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (ownError) {
        console.error('Error fetching own assinatura:', ownError);
        throw ownError;
      }
      
      if (ownSub) return ownSub as Assinatura;

      const { data: membership } = await db
        .from('memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) return null;

      const { data: org } = await db
        .from('organizations')
        .select('owner_id')
        .eq('id', membership.organization_id)
        .maybeSingle();

      if (!org) return null;

      const { data: ownerSub, error: ownerError } = await db
        .from('assinaturas')
        .select('*')
        .eq('user_id', org.owner_id)
        .maybeSingle();

      if (ownerError) {
        console.error('Error fetching owner assinatura:', ownerError);
        throw ownerError;
      }

      return ownerSub as Assinatura | null;
    },
    enabled: !!user?.id,
  });

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes_assinatura', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await db
        .from('notificacoes_assinatura')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as NotificacaoAssinatura[];
    },
    enabled: !!user?.id,
  });

  const marcarNotificacaoLida = useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await db
        .from('notificacoes_assinatura')
        .update({ lida: true })
        .eq('id', notificacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes_assinatura'] });
    },
  });

  const diasRestantes = assinatura?.data_vencimento
    ? differenceInDays(new Date(assinatura.data_vencimento), new Date())
    : null;

  const isExpirando = diasRestantes !== null && diasRestantes <= 3 && diasRestantes > 0;
  const isExpirado = diasRestantes !== null && diasRestantes <= 0;
  const isAtivo = assinatura?.status === 'ativo' && !isExpirado;

  const dataVencimentoFormatada = assinatura?.data_vencimento
    ? format(new Date(assinatura.data_vencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  const planoInfo = assinatura?.plano ? PLANOS[assinatura.plano as PlanoKey] || null : null;

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);

  return {
    assinatura,
    isLoading,
    error,
    diasRestantes,
    isExpirando,
    isExpirado,
    isAtivo,
    dataVencimentoFormatada,
    planoInfo,
    notificacoes,
    notificacoesNaoLidas,
    marcarNotificacaoLida: marcarNotificacaoLida.mutate,
  };
}
