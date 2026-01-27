import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useNotificationSound, setGlobalNotificationSound } from './useNotificationSound';

const db = supabase;

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
  const notificationSound = useNotificationSound();
  const processedIdsRef = useRef<Set<string>>(new Set());
  
  // Set global instance for access from other components
  useEffect(() => {
    setGlobalNotificationSound(notificationSound);
  }, [notificationSound]);
  
  // Handle new notification
  const handleNewNotification = useCallback((payload: any) => {
    const notification = payload.new;
    
    // Skip if already processed
    if (processedIdsRef.current.has(notification.id)) {
      return;
    }
    processedIdsRef.current.add(notification.id);
    
    // Keep set size manageable
    if (processedIdsRef.current.size > 100) {
      const arr = Array.from(processedIdsRef.current);
      processedIdsRef.current = new Set(arr.slice(-50));
    }
    
    // Play sound and vibrate
    notificationSound.playNotification(notification.tipo);
    
    // Show toast notification
    const iconMap: Record<string, string> = {
      interesse_maleta: '💖',
      visualizacao_maleta: '👀',
      estoque_baixo: '📦',
      maleta_vencendo: '⏰',
      novo_pedido: '🛒',
      meta_proxima: '🎯',
      aniversario: '🎂',
      romaneio_pendente: '📄',
    };
    
    const icon = iconMap[notification.tipo] || '🔔';
    
    toast.info(`${icon} ${notification.titulo}`, {
      description: notification.mensagem,
      duration: 5000,
      action: notification.link ? {
        label: 'Ver',
        onClick: () => {
          window.location.href = notification.link;
        },
      } : undefined,
    });
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
  }, [queryClient, notificationSound]);
  
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const setupChannel = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      channel = supabase
        .channel('notificacoes-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificacoes',
            filter: `user_id=eq.${user.id}`,
          },
          handleNewNotification
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notificacoes',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
            queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notificacoes',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
            queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
          }
        )
        .subscribe();
    };
    
    setupChannel();
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient, handleNewNotification]);
}
