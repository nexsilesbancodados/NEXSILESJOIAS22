import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { toast } from 'sonner';

const db = supabase;

export interface HistoricoPreco {
  id: string;
  peca_id: string;
  user_id: string;
  preco_anterior: number;
  preco_novo: number;
  tipo_preco: 'custo' | 'venda' | 'revenda' | 'atacado' | 'promocional';
  motivo: string | null;
  created_at: string;
  peca?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export function useHistoricoPrecos(pecaId?: string) {
  return useQuery({
    queryKey: ['historico-precos', pecaId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      let query = db
        .from('historico_precos')
        .select('*, peca:pecas(id, nome, codigo)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (pecaId) {
        query = query.eq('peca_id', pecaId);
      }
      
      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return (data || []) as HistoricoPreco[];
    },
  });
}

export function useAddHistoricoPreco() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (historico: Omit<HistoricoPreco, 'id' | 'user_id' | 'created_at' | 'peca'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await db
        .from('historico_precos')
        .insert({ ...historico, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['historico-precos'] });
      queryClient.invalidateQueries({ queryKey: ['historico-precos', variables.peca_id] });
    },
  });
}

// Helper to automatically log price changes
export function useLogPriceChange() {
  const addHistorico = useAddHistoricoPreco();
  
  return async (
    pecaId: string,
    tipoPreco: HistoricoPreco['tipo_preco'],
    precoAnterior: number,
    precoNovo: number,
    motivo?: string
  ) => {
    if (precoAnterior === precoNovo) return;
    
    await addHistorico.mutateAsync({
      peca_id: pecaId,
      tipo_preco: tipoPreco,
      preco_anterior: precoAnterior,
      preco_novo: precoNovo,
      motivo: motivo || null,
    });
  };
}

// Stats for price history
export function useEstatisticasPrecos(pecaId: string) {
  return useQuery({
    queryKey: ['estatisticas-precos', pecaId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await db
        .from('historico_precos')
        .select('*')
        .eq('user_id', user.id)
        .eq('peca_id', pecaId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      const precosCusto = data.filter((h: HistoricoPreco) => h.tipo_preco === 'custo');
      const precosVenda = data.filter((h: HistoricoPreco) => h.tipo_preco === 'venda');
      
      const calcVariacao = (precos: HistoricoPreco[]) => {
        if (precos.length < 2) return 0;
        const primeiro = precos[0].preco_anterior;
        const ultimo = precos[precos.length - 1].preco_novo;
        return ((ultimo - primeiro) / primeiro) * 100;
      };
      
      return {
        totalAlteracoes: data.length,
        ultimaAlteracao: data[data.length - 1]?.created_at,
        variacaoCusto: calcVariacao(precosCusto),
        variacaoVenda: calcVariacao(precosVenda),
        historicoCompleto: data as HistoricoPreco[],
      };
    },
    enabled: !!pecaId,
  });
}

// Bulk price update with history logging
export function useAtualizarPrecosEmMassa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      pecaIds, 
      tipoPreco,
      percentualAjuste,
      motivo 
    }: { 
      pecaIds: string[];
      tipoPreco: 'custo' | 'venda' | 'revenda' | 'atacado';
      percentualAjuste: number;
      motivo: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get current prices using loose-typed client
      const { data: pecas, error: fetchError } = await db
        .from('pecas')
        .select('id, preco, preco_venda, preco_revenda')
        .in('id', pecaIds);
      
      if (fetchError) throw fetchError;
      
      const colunasPreco: Record<string, string> = {
        custo: 'preco',
        venda: 'preco_venda',
        revenda: 'preco_revenda',
        atacado: 'preco_venda',
      };
      
      const colunaPreco = colunasPreco[tipoPreco] || 'preco';
      
      // Update prices and log history
      for (const peca of pecas || []) {
        const precoAnterior = peca[colunaPreco] || peca.preco || 0;
        const precoNovo = precoAnterior * (1 + percentualAjuste / 100);
        
        // Update price
        await db
          .from('pecas')
          .update({ [colunaPreco]: Math.round(precoNovo * 100) / 100 })
          .eq('id', peca.id);
        
        // Log history
        await db
          .from('historico_precos')
          .insert({
            user_id: user.id,
            peca_id: peca.id,
            tipo_preco: tipoPreco,
            preco_anterior: precoAnterior,
            preco_novo: Math.round(precoNovo * 100) / 100,
            motivo,
          });
      }
      
      return { updated: pecaIds.length, percentual: percentualAjuste };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      queryClient.invalidateQueries({ queryKey: ['historico-precos'] });
      const tipo = data.percentual > 0 ? 'aumentadas' : 'reduzidas';
      toast.success(`${data.updated} peças ${tipo} em ${Math.abs(data.percentual)}%`);
    },
    onError: () => {
      toast.error('Erro ao atualizar preços');
    },
  });
}
