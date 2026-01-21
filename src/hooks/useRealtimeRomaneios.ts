import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface NewRomaneio {
  id: string;
  cliente_nome: string | null;
  total: number;
  reseller_id: string;
  reseller_nome: string;
  maleta_id: string | null;
  status: string;
  data: string;
}

export function useRealtimeRomaneios() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Only subscribe if user is authenticated
    if (!user) return;

    // Create channel for realtime updates on romaneios
    const channel = supabase
      .channel('romaneios-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'romaneios',
        },
        async (payload) => {
          const newRomaneio = payload.new as NewRomaneio;
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['romaneios'] });
          queryClient.invalidateQueries({ queryKey: ['romaneios-maleta'] });
          queryClient.invalidateQueries({ queryKey: ['maleta-itens'] });

          const formatCurrency = (value: number) => {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(value);
          };

          // Show toast notification
          toast.success(
            `🛒 Nova Venda Registrada!`,
            {
              description: `${newRomaneio.reseller_nome}${newRomaneio.cliente_nome ? ` → ${newRomaneio.cliente_nome}` : ''} - ${formatCurrency(newRomaneio.total)}`,
              duration: 8000,
              position: 'top-right',
              action: {
                label: 'Ver',
                onClick: () => {
                  // Navigate to revendedoras page
                  window.location.href = '/revendedoras';
                },
              },
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

          // Create notification in database
          try {
            await supabase.rpc('criar_notificacao', {
              p_user_id: user.id,
              p_tipo: 'venda_portal',
              p_titulo: 'Nova Venda no Portal',
              p_mensagem: `${newRomaneio.reseller_nome} registrou uma venda de ${formatCurrency(newRomaneio.total)}`,
              p_entidade_tipo: 'romaneio',
              p_entidade_id: newRomaneio.id,
              p_dados: { 
                reseller_nome: newRomaneio.reseller_nome,
                cliente_nome: newRomaneio.cliente_nome,
                total: newRomaneio.total,
                maleta_id: newRomaneio.maleta_id
              },
            });
          } catch (error) {
            console.error('Error creating notification:', error);
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
  }, [user, queryClient]);
}
