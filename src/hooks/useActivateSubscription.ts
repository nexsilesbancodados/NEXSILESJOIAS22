import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Processes pending access codes after user login/signup confirmation.
 * Creates the subscription (assinatura) and marks the code as used.
 */
export function useActivateSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const processedRef = useRef(false);

  useEffect(() => {
    if (!user || processedRef.current) return;

    const pendingCode = localStorage.getItem('pending_access_code');
    if (!pendingCode) return;

    processedRef.current = true;

    const activate = async () => {
      try {
        // 1. Fetch the access code details
        const { data: codeData, error: codeError } = await supabase
          .from('codigos_acesso')
          .select('*')
          .eq('codigo', pendingCode)
          .eq('usado', false)
          .maybeSingle();

        if (codeError || !codeData) {
          console.log('Access code not found or already used:', pendingCode);
          localStorage.removeItem('pending_access_code');
          return;
        }

        // 2. Check if user already has an active subscription
        const { data: existingSub } = await supabase
          .from('assinaturas')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'ativo')
          .maybeSingle();

        if (existingSub) {
          console.log('User already has active subscription');
          // Still mark code as used
          await supabase
            .from('codigos_acesso')
            .update({ usado: true, usado_em: new Date().toISOString(), usado_por: user.id })
            .eq('id', codeData.id);
          localStorage.removeItem('pending_access_code');
          return;
        }

        // 3. Determine subscription duration based on plan
        const now = new Date();
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + 30); // 30 days

        const planoValores: Record<string, number> = {
          nexsiles: 189,
          nexsiles_max: 249,
          teste: 1,
        };

        const valorMensal = planoValores[codeData.plano] || codeData.valor_pago || 0;

        // 4. Create the subscription
        const { error: subError } = await supabase
          .from('assinaturas')
          .upsert({
            user_id: user.id,
            plano: codeData.plano === 'teste' ? 'nexsiles' : codeData.plano,
            status: 'ativo',
            data_inicio: now.toISOString(),
            data_vencimento: dataVencimento.toISOString(),
            valor_mensal: valorMensal,
            metodo_pagamento: 'pix',
            mercadopago_payment_id: codeData.mercadopago_payment_id,
          }, {
            onConflict: 'user_id',
          });

        if (subError) {
          console.error('Error creating subscription:', subError);
          processedRef.current = false;
          return;
        }

        // 5. Mark code as used
        await supabase
          .from('codigos_acesso')
          .update({
            usado: true,
            usado_em: new Date().toISOString(),
            usado_por: user.id,
          })
          .eq('id', codeData.id);

        // 6. Cleanup and notify
        localStorage.removeItem('pending_access_code');
        queryClient.invalidateQueries({ queryKey: ['assinatura'] });
        
        const planoNome = codeData.plano === 'nexsiles_max' ? 'Nexsiles Max' : 'Nexsiles';
        toast.success(`🎉 Assinatura ${planoNome} ativada!`, {
          description: 'Seu plano está ativo por 30 dias.',
          duration: 6000,
        });

        console.log('Subscription activated for user:', user.id, 'plan:', codeData.plano);
      } catch (error) {
        console.error('Error activating subscription:', error);
        processedRef.current = false;
      }
    };

    activate();
  }, [user, queryClient]);
}
