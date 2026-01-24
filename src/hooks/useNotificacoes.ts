import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

// Use loose typing to bypass schema validation until migrations are applied
const db = supabase as any;

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  user_id: string;
  dados: Record<string, unknown> | null;
  entidade_tipo: string | null;
  entidade_id: string | null;
  created_at: string;
}

export function useNotificacoes(limit = 50) {
  return useQuery({
    queryKey: ['notificacoes', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await db
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as Notificacao[];
    },
  });
}

export function useNotificacoesNaoLidas() {
  return useQuery({
    queryKey: ['notificacoes-nao-lidas'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await db
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .eq('lida', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Notificacao[];
    },
  });
}

export function useMarcarComoLida() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await db
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
    },
  });
}

export function useMarcarTodasComoLidas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await db
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
    },
  });
}

export function useDeletarNotificacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await db
        .from('notificacoes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
    },
  });
}

export function useNotificacoesRealtime() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
          queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
