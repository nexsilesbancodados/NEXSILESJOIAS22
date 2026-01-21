import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function QueryErrorHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.state.status === 'error') {
        const error = event.query.state.error as Error;
        
        // Handle specific error types
        if (error?.message?.includes('JWT')) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
          toast.error('Erro de conexão. Verifique sua internet.');
        } else if (error?.message?.includes('RLS') || error?.message?.includes('row-level security')) {
          toast.error('Você não tem permissão para acessar estes dados.');
        } else if (error?.message?.includes('PGRST116')) {
          // Single row not found - often expected, don't show error
          console.log('No data found:', event.query.queryKey);
        }
        // Other errors are handled by individual hooks with their own toast messages
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return null;
}
