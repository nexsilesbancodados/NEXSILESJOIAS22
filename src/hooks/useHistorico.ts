import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';

const db = supabase;

export interface HistoricoAtividade {
  id: string;
  tipo: 'criacao' | 'atualizacao' | 'exclusao';
  descricao: string;
  entidade: string;
  entidade_id: string | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  valor: number | null;
  created_at: string;
}

export type EntidadeFilter = 
  | 'todas'
  | 'vendas'
  | 'romaneios'
  | 'maletas'
  | 'pecas'
  | 'catalogos'
  | 'pedidos_catalogo'
  | 'caixa_sessoes'
  | 'profiles';

export type TipoFilter = 'todos' | 'criacao' | 'atualizacao' | 'exclusao';

interface UseHistoricoOptions {
  entidade?: EntidadeFilter;
  tipo?: TipoFilter;
  limit?: number;
  dataInicio?: Date;
  dataFim?: Date;
}

export function useHistorico(options: UseHistoricoOptions = {}) {
  const { entidade = 'todas', tipo = 'todos', limit = 100, dataInicio, dataFim } = options;
  
  return useQuery({
    queryKey: ['historico', entidade, tipo, limit, dataInicio?.toISOString(), dataFim?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      let query = db
        .from('historico_atividades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (entidade !== 'todas') {
        query = query.eq('entidade', entidade);
      }
      
      if (tipo !== 'todos') {
        query = query.eq('tipo', tipo);
      }
      
      if (dataInicio) {
        query = query.gte('created_at', dataInicio.toISOString());
      }
      
      if (dataFim) {
        query = query.lte('created_at', dataFim.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as HistoricoAtividade[];
    },
  });
}

export function useHistoricoVendas(limit = 50) {
  return useHistorico({ entidade: 'vendas', limit });
}

export function useHistoricoRomaneios(limit = 50) {
  return useHistorico({ entidade: 'romaneios', limit });
}

export function useHistoricoMaletas(limit = 50) {
  return useHistorico({ entidade: 'maletas', limit });
}

export function useHistoricoPecas(limit = 50) {
  return useHistorico({ entidade: 'pecas', limit });
}

export function useHistoricoCatalogos(limit = 50) {
  return useHistorico({ entidade: 'catalogos', limit });
}

export function useHistoricoPedidosCatalogo(limit = 50) {
  return useHistorico({ entidade: 'pedidos_catalogo', limit });
}

export function useHistoricoCaixa(limit = 50) {
  return useHistorico({ entidade: 'caixa_sessoes', limit });
}

export function useHistoricoProfiles(limit = 50) {
  return useHistorico({ entidade: 'profiles', limit });
}
