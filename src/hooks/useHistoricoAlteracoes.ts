import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import type { Json } from '@/integrations/supabase/types';

const db = supabase;

// Interface aligned with actual database schema but with backwards-compatible aliases
export interface HistoricoAlteracao {
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
  tipo: string;
  entidade: string;
  entidade_id: string | null;
  descricao: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  valor: number | null;
}

interface UseHistoricoOptions {
  tabela?: string;
  registroId?: string;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
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

export function useHistoricoAlteracoes(options: UseHistoricoOptions = {}) {
  const { tabela, registroId, limit = 50, startDate, endDate } = options;

  return useQuery({
    queryKey: ['historico-alteracoes', tabela, registroId, limit, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = db
        .from('historico_atividades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tabela) {
        query = query.eq('tabela', tabela);
      }

      if (registroId) {
        query = query.eq('registro_id', registroId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform data to include backwards-compatible fields
      return (data || []).map((item: any) => ({
        ...item,
        tipo: mapAcaoToTipo(item.acao),
        entidade: item.tabela,
        entidade_id: item.registro_id,
        descricao: generateDescricao(item.tabela, item.acao),
        usuario_id: item.user_id,
        usuario_nome: null,
        valor: null,
      })) as HistoricoAlteracao[];
    },
  });
}

export function useHistoricoPecas(pecaId?: string) {
  return useHistoricoAlteracoes({
    tabela: 'pecas',
    registroId: pecaId,
    limit: 20,
  });
}

export function useHistoricoVendas(vendaId?: string) {
  return useHistoricoAlteracoes({
    tabela: 'vendas',
    registroId: vendaId,
    limit: 20,
  });
}

export function useHistoricoRecente(limit: number = 10) {
  return useHistoricoAlteracoes({ limit });
}

// Helper para registrar alterações manualmente
export async function registrarAlteracao(params: {
  acao: 'criacao' | 'atualizacao' | 'exclusao';
  tabela: string;
  registro_id?: string;
  dados_anteriores?: Json;
  dados_novos?: Json;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  // Get user's organization_id
  const { data: membership } = await db
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user?.user?.id || '')
    .maybeSingle();
  
  const { error } = await db.from('historico_atividades').insert([{
    tabela: params.tabela,
    acao: params.acao,
    registro_id: params.registro_id || null,
    user_id: user?.user?.id || null,
    dados_anteriores: params.dados_anteriores || null,
    dados_novos: params.dados_novos || null,
    organization_id: membership?.organization_id || null,
  }]);

  if (error) {
    console.error('Erro ao registrar alteração:', error);
  }
}