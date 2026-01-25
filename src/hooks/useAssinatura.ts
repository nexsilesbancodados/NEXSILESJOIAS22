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
    descricao: 'Plano básico para gestão de joias',
    recursos: [
      'Gestão de peças e estoque',
      'Controle de vendas',
      'Gestão de revendedoras',
      'Relatórios básicos',
      'Catálogos digitais',
    ],
    valor: 49.90,
  },
  nexsiles_max: {
    nome: 'Nexsiles Max',
    descricao: 'Plano completo com IA integrada',
    recursos: [
      'Tudo do plano Nexsiles',
      'Atendente de IA integrado',
      'Chatbot WhatsApp automatizado',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    valor: 99.90,
  },
} as const;

export function useAssinatura() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assinatura, isLoading, error } = useQuery({
    queryKey: ['assinatura', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await db
        .from('assinaturas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data as Assinatura | null;
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
