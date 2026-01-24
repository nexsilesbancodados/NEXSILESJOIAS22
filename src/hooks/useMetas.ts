import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '@/lib/supabase-db';
import { toast } from '@/hooks/use-toast';

export interface Meta {
  id: string;
  tipo: string;
  valor: number;
  mes: number;
  ano: number;
  user_id: string | null;
  created_at: string;
}

export function useMetas(ano?: number) {
  const currentYear = ano || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['metas', currentYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await db
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ano', currentYear)
        .order('mes', { ascending: true });
      
      if (error) throw error;
      return data as Meta[];
    },
  });
}

export function useMetaAtual() {
  const mes = new Date().getMonth() + 1;
  const ano = new Date().getFullYear();
  
  return useQuery({
    queryKey: ['meta-atual', mes, ano],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await db
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .eq('tipo', 'faturamento')
        .maybeSingle();
      
      if (error) throw error;
      return data as Meta | null;
    },
  });
}

export function useAddMeta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (meta: Omit<Meta, 'id' | 'created_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await db
        .from('metas')
        .upsert({
          ...meta,
          user_id: user.id,
        }, {
          onConflict: 'tipo,mes,ano,user_id'
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

export function useDeleteMeta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await db
        .from('metas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
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
