import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/supabase-db';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Assinatura {
  id: string;
  user_id: string;
  plano: 'nexsiles' | 'nexsiles_max';
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
  // Trial fields
  trial_ativo?: boolean;
  trial_iniciado_em?: string;
  trial_dias?: number;
  // Payment fields
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
    descricao: 'Plano completo para gestão de semi-joias',
    recursos: [
      'Gestão de peças e estoque',
      'Controle de vendas (PDV)',
      'Gestão de revendedoras e maletas',
      'Catálogos digitais',
      'Relatórios completos',
      'Portal da revendedora',
    ],
    valor: 189.00,
  },
  nexsiles_max: {
    nome: 'Nexsiles Max',
    descricao: 'Tudo do Nexsiles + IA integrada',
    recursos: [
      'Tudo do plano Nexsiles',
      'Atendente de IA integrado',
      'Chatbot WhatsApp automatizado',
      'Recomendações inteligentes',
      'Suporte prioritário',
    ],
    valor: 249.00,
  },
} as const;

export function useAssinatura() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assinatura, isLoading, error } = useQuery({
    queryKey: ['assinatura', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // First try the user's own subscription
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

      // If no own subscription, find org owner's subscription
      const { data: membership } = await db
        .from('memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) return null;

      // Find the org owner
      const { data: ownerMembership } = await db
        .from('memberships')
        .select('user_id')
        .eq('organization_id', membership.organization_id)
        .eq('role', 'owner')
        .maybeSingle();

      if (!ownerMembership) return null;

      // Get the owner's subscription
      const { data: ownerSub, error: ownerError } = await db
        .from('assinaturas')
        .select('*')
        .eq('user_id', ownerMembership.user_id)
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

  // Calculated values
  const diasRestantes = assinatura?.data_vencimento
    ? differenceInDays(new Date(assinatura.data_vencimento), new Date())
    : null;

  const isExpirando = diasRestantes !== null && diasRestantes <= 3 && diasRestantes > 0;
  const isExpirado = diasRestantes !== null && diasRestantes <= 0;
  const isAtivo = assinatura?.status === 'ativo' && !isExpirado;

  const dataVencimentoFormatada = assinatura?.data_vencimento
    ? format(new Date(assinatura.data_vencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  const planoInfo = assinatura?.plano ? PLANOS[assinatura.plano] : null;

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
