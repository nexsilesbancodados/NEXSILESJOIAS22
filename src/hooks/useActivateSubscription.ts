import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { enviarNotificacaoEmail } from '@/lib/email-notifications';

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
    const pendingTrial = localStorage.getItem('pending_trial');
    
    if (!pendingCode && !pendingTrial) return;

    processedRef.current = true;

    const activateTrial = async () => {
      try {
        // Check if user already has an active subscription
        const { data: existingSub } = await supabase
          .from('assinaturas')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'ativo')
          .maybeSingle();

        if (existingSub) {
          console.log('User already has active subscription, skipping trial');
          localStorage.removeItem('pending_trial');
          return;
        }

        const now = new Date();
        const trialEndDate = new Date(now);
        trialEndDate.setDate(trialEndDate.getDate() + 3);

        const { error } = await supabase
          .from('assinaturas')
          .upsert({
            user_id: user.id,
            plano: 'nexsiles',
            status: 'ativo',
            trial_ativo: true,
            trial_iniciado_em: now.toISOString(),
            trial_dias: 3,
            data_inicio: now.toISOString(),
            data_vencimento: trialEndDate.toISOString(),
            valor_mensal: 0,
          }, {
            onConflict: 'user_id',
          });

        if (error) {
          console.error('Error activating trial:', error);
          processedRef.current = false;
          return;
        }

        localStorage.removeItem('pending_trial');
        queryClient.invalidateQueries({ queryKey: ['assinatura'] });
        
        // Send welcome email
        enviarNotificacaoEmail('boas_vindas' as any, {
          plano_nome: 'Nexsiles',
          dias_validade: 3,
          is_trial: true,
        });

        toast.success('🎉 Teste grátis ativado!', {
          description: 'Você tem 3 dias para explorar todas as funcionalidades do Nexsiles!',
          duration: 6000,
        });

        console.log('Trial activated for user:', user.id);
      } catch (error) {
        console.error('Error activating trial:', error);
        processedRef.current = false;
      }
    };

    const activateCode = async () => {
      try {
        // 1. Fetch the access code details
        const { data: codeData, error: codeError } = await supabase
          .from('codigos_acesso')
          .select('*')
          .eq('codigo', pendingCode!)
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
        dataVencimento.setDate(dataVencimento.getDate() + 30);

        const planoValores: Record<string, number> = {
          ecommerce_premium: 149,
          nexsiles: 189,
          nexsiles_ysis: 249,
          nexsiles_commerce: 299,
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
        
        const planoNomes: Record<string, string> = { ecommerce_premium: 'E-commerce Premium', nexsiles: 'Nexsiles', nexsiles_ysis: 'Nexsiles Ysis', nexsiles_commerce: 'Nexsiles Commerce' };
        const planoNome = planoNomes[codeData.plano] || codeData.plano;

        // Send welcome email
        enviarNotificacaoEmail('boas_vindas' as any, {
          plano_nome: planoNome,
          dias_validade: 30,
          is_trial: false,
        });

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

    if (pendingTrial) {
      activateTrial();
    } else if (pendingCode) {
      activateCode();
    }
  }, [user, queryClient]);
}
