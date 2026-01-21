import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface HistoricoAlteracao {
  id: string;
  tipo: string;
  descricao: string;
  entidade: string;
  entidade_id: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  dados_anteriores: Json | null;
  dados_novos: Json | null;
  valor: number | null;
  created_at: string;
}

interface UseHistoricoOptions {
  entidade?: string;
  entidadeId?: string;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

export function useHistoricoAlteracoes(options: UseHistoricoOptions = {}) {
  const { entidade, entidadeId, limit = 50, startDate, endDate } = options;

  return useQuery({
    queryKey: ['historico-alteracoes', entidade, entidadeId, limit, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('historico_atividades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entidade) {
        query = query.eq('entidade', entidade);
      }

      if (entidadeId) {
        query = query.eq('entidade_id', entidadeId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HistoricoAlteracao[];
    },
  });
}

export function useHistoricoPecas(pecaId?: string) {
  return useHistoricoAlteracoes({
    entidade: 'pecas',
    entidadeId: pecaId,
    limit: 20,
  });
}

export function useHistoricoVendas(vendaId?: string) {
  return useHistoricoAlteracoes({
    entidade: 'vendas',
    entidadeId: vendaId,
    limit: 20,
  });
}

export function useHistoricoRecente(limit: number = 10) {
  return useHistoricoAlteracoes({ limit });
}

// Helper para registrar alterações (chamado automaticamente via triggers no DB)
export async function registrarAlteracao(params: {
  tipo: 'criacao' | 'atualizacao' | 'exclusao';
  descricao: string;
  entidade: string;
  entidade_id?: string;
  dados_anteriores?: Json;
  dados_novos?: Json;
  valor?: number;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  const { error } = await supabase.from('historico_atividades').insert([{
    tipo: params.tipo,
    descricao: params.descricao,
    entidade: params.entidade,
    entidade_id: params.entidade_id || null,
    usuario_id: user?.user?.id || null,
    usuario_nome: user?.user?.email || 'Sistema',
    dados_anteriores: params.dados_anteriores || null,
    dados_novos: params.dados_novos || null,
    valor: params.valor || null,
  }]);

  if (error) {
    console.error('Erro ao registrar alteração:', error);
  }
}
