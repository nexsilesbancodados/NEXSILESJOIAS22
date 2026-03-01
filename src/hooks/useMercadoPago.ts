import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckoutOptions {
  plano: 'nexsiles' | 'nexsiles_ysis' | 'nexsiles_commerce';
  periodo: 'mensal' | 'anual';
}

export function useMercadoPago() {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckout = async ({ plano, periodo }: CheckoutOptions) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado para assinar');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: { plano, periodo },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Erro ao iniciar pagamento');
        return null;
      }

      // Redirect to Mercado Pago checkout
      if (data?.initPoint) {
        window.location.href = data.initPoint;
      } else if (data?.sandboxInitPoint) {
        // Use sandbox in development
        window.location.href = data.sandboxInitPoint;
      } else {
        toast.error('Erro ao obter link de pagamento');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao processar pagamento');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckout,
    isLoading,
  };
}
