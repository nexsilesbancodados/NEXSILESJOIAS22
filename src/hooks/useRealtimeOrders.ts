import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NewOrder {
  id: string;
  cliente_nome: string;
  total: number;
  catalogo_id: string;
}

export function useRealtimeOrders() {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Only subscribe if user is authenticated
    if (!user) return;

    // Create channel for realtime updates
    const channel = supabase
      .channel('pedidos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos_catalogo',
        },
        async (payload) => {
          const newOrder = payload.new as NewOrder;
          
          // Fetch catalog name for better notification
          const { data: catalogo } = await supabase
            .from('catalogos')
            .select('nome')
            .eq('id', newOrder.catalogo_id)
            .single();

          const formatCurrency = (value: number) => {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(value);
          };

          // Show toast notification
          toast.success(
            `🛍️ Novo Pedido de ${newOrder.cliente_nome}`,
            {
              description: `${catalogo?.nome || 'Catálogo'} - ${formatCurrency(newOrder.total)}`,
              duration: 8000,
              position: 'top-right',
            }
          );

          // Play notification sound
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVkYKW6w18KweGU7OX6/08ahaVQ8Roa/ybKLcVxAVYy/xquLdGFKWoq4wKeJdmVPXYq1vKKIeGtXYIWyuJ6HeHBcZIKtt5mDd3FjaoGptZaCc29jcIKlsZGAcW5meYSiqI18bGpwgYWem4t5Z2ZwhI+Yn4p3ZmZ0h5OXmId1YWV4iJORlIVzYWR8ipCPkoNyYGR/jI+NkIFwYWWDjI2Mj35uYGaFjIuMjnxtYGaIjIqLjXxsYGeMjIiKjXxrYGmOi4aJjXtrYGuQi4SIjHtqYW2RioKHi3ppYW+SiYCGinppYXGTiH6FiXloYXOUh3yEiHhnYXaVhnqDh3dmYXiWg3iChndlYXuWgXaBhXZkYX6XfnSAhHVjYYCYfHJ/g3RiYYOYeXB+gnNhYIaZd255gXJgYImZdWx4gHFfX4yacmo3f3BeX4+bcWc2fm9dXpKdbmQ0fW5cXZWfbGEze2xbXJihalgweWtaW5ujZ1Uud2lZWp2lZVIsdbdYWZ+nY08qc2dWWKKpYEwnb2VVV6WrXUkkanNUVqiuWkYhaGJSVauxWEMdZmBRVK60VUAaZF5QU7G3UjsXYVxPUrS6TzgUXlpOUbe9TC8RW1hNULrASSsOWFZMT73DRSgLVVRKTsDGQCQIUlJJTMPJOyAFT09ISMbNNRwCTExGRsnQMBf+SEpFRczTKxP7RUZEQs/XJQ/4QkRDQNLaHwv1P0FCPtXdGQbyPD9BPNjgEQPvOjw/Otvj');
            audio.volume = 0.5;
            audio.play().catch(() => {
              // Audio autoplay might be blocked
            });
          } catch {
            // Ignore audio errors
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);
}
