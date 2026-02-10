import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import type { Json } from '@/integrations/supabase/types';

const db = supabase;

// Interface aligned with actual database schema but with backwards-compatible aliases
export interface HistoricoAtividade {
  id: string;
  tabela: string;
  acao: string;
  registro_id: string | null;
  user_id: string | null;
  organization_id: string | null;
  dados_anteriores: Json | null;
  dados_novos: Json | null;
  ip_address: string | null;
  created_at: string | null;
  // Backwards-compatible aliases
  tipo: string; // alias for acao
  entidade: string; // alias for tabela
  entidade_id: string | null; // alias for registro_id
  descricao: string; // generated description
  usuario_id: string | null; // alias for user_id
  usuario_nome: string | null; // not stored, placeholder
  valor: number | null; // not stored, placeholder
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
  | 'profiles'
  | 'clientes'
  | 'revendedoras'
  | 'campanhas';

export type TipoFilter = 'todos' | 'criacao' | 'atualizacao' | 'exclusao' | 'INSERT' | 'UPDATE' | 'DELETE';

interface UseHistoricoOptions {
  entidade?: EntidadeFilter;
  tipo?: TipoFilter;
  limit?: number;
  dataInicio?: Date;
  dataFim?: Date;
}

// Helper to map acao to tipo
function mapAcaoToTipo(acao: string): string {
  const mapping: Record<string, string> = {
    'INSERT': 'criacao',
    'UPDATE': 'atualizacao',
    'DELETE': 'exclusao',
    'criacao': 'criacao',
    'atualizacao': 'atualizacao',
    'exclusao': 'exclusao',
  };
  return mapping[acao] || acao;
}

// Helper to generate description
function generateDescricao(tabela: string, acao: string): string {
  const acaoTexto = mapAcaoToTipo(acao);
  const acaoLabel = acaoTexto === 'criacao' ? 'criado' : acaoTexto === 'atualizacao' ? 'atualizado' : 'excluído';
  return `Registro ${acaoLabel} em ${tabela}`;
}

export function useHistorico(options: UseHistoricoOptions = {}) {
  const { entidade = 'todas', tipo = 'todos', limit = 100, dataInicio, dataFim } = options;
  
  return useQuery({
    queryKey: ['historico', entidade, tipo, limit, dataInicio?.toISOString(), dataFim?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      // RLS handles organization filtering automatically
      let query = db
        .from('historico_atividades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (entidade !== 'todas') {
        query = query.eq('tabela', entidade);
      }
      
      if (tipo !== 'todos') {
        // Map tipo to database acao values
        const acaoValues = tipo === 'criacao' ? ['INSERT', 'criacao'] 
          : tipo === 'atualizacao' ? ['UPDATE', 'atualizacao']
          : tipo === 'exclusao' ? ['DELETE', 'exclusao']
          : [tipo];
        query = query.in('acao', acaoValues);
      }
      
      if (dataInicio) {
        query = query.gte('created_at', dataInicio.toISOString());
      }
      
      if (dataFim) {
        query = query.lte('created_at', dataFim.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch user names for all unique user_ids
      const userIds = [...new Set((data || []).map((item: any) => item.user_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await db
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);
        
        if (profiles) {
          profileMap = Object.fromEntries(
            profiles.map((p: any) => [p.user_id, p.nome])
          );
        }
      }
      
      // Transform data to include backwards-compatible fields
      return (data || []).map((item: any) => ({
        ...item,
        tipo: mapAcaoToTipo(item.acao),
        entidade: item.tabela,
        entidade_id: item.registro_id,
        descricao: generateDescricao(item.tabela, item.acao),
        usuario_id: item.user_id,
        usuario_nome: item.user_id ? (profileMap[item.user_id] || null) : null,
        valor: null,
      })) as HistoricoAtividade[];
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