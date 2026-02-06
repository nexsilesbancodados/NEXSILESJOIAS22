import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

interface PushNotificationOptions {
  enabled: boolean;
  onNewConversation?: boolean;
  onHumanRequest?: boolean;
  onNewOrder?: boolean;
}

export function usePushNotifications(options: PushNotificationOptions = { enabled: true }) {
  const { organizationId } = useOrganization();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações push');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notificações push ativadas!');
        return true;
      } else if (result === 'denied') {
        toast.error('Permissão para notificações foi negada');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Erro ao solicitar permissão para notificações');
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'agent-notification',
        requireInteraction: true,
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Also play sound if available
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {
        // Ignore audio errors
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!options.enabled || !organizationId || permission !== 'granted') return;

    const channel = supabase
      .channel('agent-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agente_fila_humana',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (options.onHumanRequest !== false) {
            showNotification(
              '👤 Atendimento Humano Solicitado',
              'Um cliente está aguardando atendimento humano na fila.',
              { tag: 'human-request' }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agente_conversas',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (options.onNewConversation !== false) {
            const data = payload.new as Record<string, unknown>;
            showNotification(
              '💬 Nova Conversa',
              `${data.cliente_nome || 'Cliente'} iniciou uma nova conversa.`,
              { tag: 'new-conversation' }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos_catalogo',
        },
        (payload) => {
          if (options.onNewOrder !== false) {
            const data = payload.new as Record<string, unknown>;
            showNotification(
              '🛒 Novo Pedido!',
              `${data.cliente_nome || 'Cliente'} fez um novo pedido via catálogo.`,
              { tag: 'new-order' }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, options, permission, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    isEnabled: permission === 'granted',
  };
}
