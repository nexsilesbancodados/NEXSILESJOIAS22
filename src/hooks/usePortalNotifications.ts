import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PortalNotification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  link?: string;
}

interface UsePortalNotificationsProps {
  revendedoraId: string | null;
  enabled: boolean;
}

export function usePortalNotifications({ revendedoraId, enabled }: UsePortalNotificationsProps) {
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Show browser push notification
  const showPushNotification = useCallback((title: string, body: string, link?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'portal-notification',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (link) {
          window.location.href = link;
        }
      };

      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, []);

  // Fetch notifications from maleta_interesses (as portal doesn't use auth)
  const fetchNotifications = useCallback(async () => {
    if (!revendedoraId) return;
    
    setLoading(true);
    try {
      // Get maleta IDs for this revendedora
      const { data: maletasData } = await supabase
        .from('maletas')
        .select('id')
        .eq('revendedora_id', revendedoraId);

      if (!maletasData || maletasData.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const maletaIds = maletasData.map(m => m.id);

      // Get recent interests as notifications
      const { data, error } = await supabase
        .from('maleta_interesses')
        .select(`
          id,
          cliente_nome,
          status,
          created_at,
          maleta:maletas(id, nome)
        `)
        .in('maleta_id', maletaIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedNotifications: PortalNotification[] = (data || []).map(interesse => {
        const maleta = Array.isArray(interesse.maleta) ? interesse.maleta[0] : interesse.maleta;
        return {
          id: interesse.id,
          tipo: 'novo_pedido',
          titulo: interesse.status === 'pendente' ? '🛒 Novo Pedido!' : '📦 Pedido',
          mensagem: `${interesse.cliente_nome} fez um pedido na maleta "${maleta?.nome || 'Maleta'}"`,
          lida: interesse.status !== 'pendente',
          created_at: interesse.created_at || new Date().toISOString(),
        };
      });

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter(n => !n.lida).length);
    } catch (error) {
      console.error('Error fetching portal notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [revendedoraId]);

  // Handle new interesse
  const handleNewInteresse = useCallback((payload: any) => {
    const interesse = payload.new;
    
    // Skip if already processed
    if (processedIdsRef.current.has(interesse.id)) {
      return;
    }
    processedIdsRef.current.add(interesse.id);

    // Keep set size manageable
    if (processedIdsRef.current.size > 50) {
      const arr = Array.from(processedIdsRef.current);
      processedIdsRef.current = new Set(arr.slice(-25));
    }

    console.log('New interesse received:', interesse);

    // Show toast notification
    toast.success('🛒 Novo Pedido Recebido!', {
      description: `${interesse.cliente_nome} fez um pedido. Clique para revisar.`,
      duration: 10000,
      action: {
        label: 'Ver Pedidos',
        onClick: () => {
          // Scroll to pedidos tab or refresh
          window.location.reload();
        },
      },
    });

    // Show browser push notification if app is in background
    if (document.hidden) {
      showPushNotification(
        '🛒 Novo Pedido Recebido!',
        `${interesse.cliente_nome} fez um novo pedido. Acesse o portal para aprovar.`,
        '/portal/login'
      );
    }

    // Play notification sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      console.log('Audio not supported');
    }

    // Refresh notifications
    fetchNotifications();
  }, [fetchNotifications, showPushNotification]);

  // Setup realtime subscription
  useEffect(() => {
    if (!enabled || !revendedoraId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupChannel = async () => {
      // First get maleta IDs
      const { data: maletasData } = await supabase
        .from('maletas')
        .select('id')
        .eq('revendedora_id', revendedoraId);

      if (!maletasData || maletasData.length === 0) return;

      const maletaIds = maletasData.map(m => m.id);

      // Subscribe to new interests in these maletas
      channel = supabase
        .channel(`portal-notifications-${revendedoraId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'maleta_interesses',
          },
          async (payload) => {
            // Check if this interesse is for one of our maletas
            if (maletaIds.includes(payload.new.maleta_id)) {
              handleNewInteresse(payload);
            }
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
  }, [enabled, revendedoraId, handleNewInteresse]);

  // Initial fetch and request permission
  useEffect(() => {
    if (enabled && revendedoraId) {
      fetchNotifications();
      requestNotificationPermission();
    }
  }, [enabled, revendedoraId, fetchNotifications, requestNotificationPermission]);

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
  };
}
