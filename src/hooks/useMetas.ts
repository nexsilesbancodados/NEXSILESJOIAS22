import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '@/lib/supabase-db';
import { toast } from '@/hooks/use-toast';

export interface Meta {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo?: string | null;
  valor_meta: number;
  valor_atual?: number | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  revendedora_id?: string | null;
  campanha_id?: string | null;
  atingida?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export function useMetas() {
  return useQuery({
    queryKey: ['metas'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await db
        .from('metas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Meta[];
    },
  });
}

export function useMetaAtual() {
  return useQuery({
    queryKey: ['meta-atual'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await db
        .from('metas')
        .select('*')
        .eq('tipo', 'faturamento')
        .lte('data_inicio', hoje)
        .gte('data_fim', hoje)
        .maybeSingle();
      
      if (error) throw error;
      return data as Meta | null;
    },
  });
}

export function useAddMeta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (meta: Omit<Meta, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await db
        .from('metas')
        .insert({
          titulo: meta.titulo,
          descricao: meta.descricao,
          tipo: meta.tipo,
          valor_meta: meta.valor_meta,
          valor_atual: meta.valor_atual || 0,
          data_inicio: meta.data_inicio,
          data_fim: meta.data_fim,
          revendedora_id: meta.revendedora_id,
          campanha_id: meta.campanha_id,
          atingida: meta.atingida || false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas'] });
      queryClient.invalidateQueries({ queryKey: ['meta-atual'] });
      toast({ title: 'Meta salva com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar meta', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateMeta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...meta }: Partial<Meta> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await db
        .from('metas')
        .update({
          ...meta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas'] });
      queryClient.invalidateQueries({ queryKey: ['meta-atual'] });
      toast({ title: 'Meta atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar meta', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteMeta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await db
        .from('metas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas'] });
      queryClient.invalidateQueries({ queryKey: ['meta-atual'] });
      toast({ title: 'Meta removida com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover meta', description: error.message, variant: 'destructive' });
    },
  });
}
