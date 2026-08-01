import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  portalRpc,
  PortalSessionExpired,
  type PortalNotificacaoRow,
} from '@/lib/portal-session';

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

const POLL_INTERVAL_MS = 30_000;

/**
 * Notificações do portal (pedidos feitos nas maletas da revendedora).
 *
 * Antes este hook lia `maletas` e `maleta_interesses` direto do banco com a
 * chave anon, filtrando por revendedora_id — o que dependia de policies
 * permissivas e expunha PII de clientes de outros tenants. Agora usa a RPC
 * portal_fetch_notificacoes, que deriva a revendedora do token de sessão.
 *
 * Como a assinatura realtime dependia daquele mesmo acesso anônimo, a
 * atualização passa a ser por polling (1 min) — o portal é uma tela de uso
 * pontual, o custo é irrelevante e o comportamento visível é o mesmo.
 */
export function usePortalNotifications({ revendedoraId, enabled }: UsePortalNotificationsProps) {
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const primeiraCargaRef = useRef(true);

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

      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, []);

  const tocarSom = useCallback(() => {
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
    } catch {
      /* áudio não suportado */
    }
  }, []);

  const avisarNovoPedido = useCallback((clienteNome: string) => {
    toast.success('🛒 Novo Pedido Recebido!', {
      description: `${clienteNome} fez um pedido. Clique para revisar.`,
      duration: 10000,
      action: {
        label: 'Ver Pedidos',
        onClick: () => window.location.reload(),
      },
    });

    if (document.hidden) {
      showPushNotification(
        '🛒 Novo Pedido Recebido!',
        `${clienteNome} fez um novo pedido. Acesse o portal para aprovar.`,
        '/portal/login'
      );
    }

    tocarSom();
  }, [showPushNotification, tocarSom]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await portalRpc<PortalNotificacaoRow[]>('portal_fetch_notificacoes');
      const linhas = data || [];

      const formatted: PortalNotification[] = linhas.map((row) => ({
        id: row.id,
        tipo: 'novo_pedido',
        titulo: row.status === 'pendente' ? '🛒 Novo Pedido!' : '📦 Pedido',
        mensagem: `${row.cliente_nome} fez um pedido na maleta "${row.maleta_nome || 'Maleta'}"`,
        lida: row.status !== 'pendente',
        created_at: row.created_at || new Date().toISOString(),
      }));

      // Avisa apenas o que chegou depois da primeira carga.
      if (!primeiraCargaRef.current) {
        for (const row of linhas) {
          if (!knownIdsRef.current.has(row.id) && row.status === 'pendente') {
            avisarNovoPedido(row.cliente_nome || 'Cliente');
          }
        }
      }

      knownIdsRef.current = new Set(formatted.map((n) => n.id));
      primeiraCargaRef.current = false;

      setNotifications(formatted);
      setUnreadCount(formatted.filter((n) => !n.lida).length);
    } catch (error) {
      if (error instanceof PortalSessionExpired) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      console.error('Error fetching portal notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [avisarNovoPedido]);

  // Carga inicial + verificação periódica.
  // Só consulta com a aba visível: no celular da revendedora, ficar buscando com
  // o app em segundo plano gasta bateria e dados à toa. Ao voltar para a aba,
  // busca na hora — que é quando ela vai olhar as notificações.
  useEffect(() => {
    if (!enabled || !revendedoraId) return;

    primeiraCargaRef.current = true;
    fetchNotifications();
    requestNotificationPermission();

    let timer: ReturnType<typeof setInterval> | null = null;

    const iniciar = () => {
      if (timer) return;
      timer = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    };
    const parar = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };
    const aoMudarVisibilidade = () => {
      if (document.hidden) {
        parar();
      } else {
        fetchNotifications();
        iniciar();
      }
    };

    if (!document.hidden) iniciar();
    document.addEventListener('visibilitychange', aoMudarVisibilidade);

    return () => {
      parar();
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, [enabled, revendedoraId, fetchNotifications, requestNotificationPermission]);

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
  };
}
