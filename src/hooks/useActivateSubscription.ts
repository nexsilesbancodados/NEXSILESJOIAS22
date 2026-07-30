import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { dbRpc } from '@/lib/supabase-db';
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
        // Ativação inteira no banco: uma RPC transacional que valida o código,
        // exige que o e-mail do código seja o do usuário logado, cria/atualiza a
        // assinatura e marca o código como usado. É idempotente.
        //
        // Antes isso era feito daqui com SELECT + UPDATE direto em
        // codigos_acesso, sem amarrar o código ao e-mail — quem conhecesse um
        // código válido ativava o plano na própria conta.
        const { data: result, error: rpcError } = await dbRpc('ativar_codigo_acesso', {
          p_codigo: pendingCode!,
        });

        if (rpcError) {
          console.error('Error activating access code:', rpcError);
          processedRef.current = false;
          return;
        }

        if (!result?.ok) {
          console.log('Access code not activated:', result?.erro);
          if (result?.erro === 'email_divergente') {
            toast.error('O código pertence a outro e-mail', {
              description: 'Entre com o mesmo e-mail usado na compra ou fale com o suporte.',
              duration: 8000,
            });
          }
          localStorage.removeItem('pending_access_code');
          return;
        }

        // Cleanup and notify
        localStorage.removeItem('pending_access_code');
        queryClient.invalidateQueries({ queryKey: ['assinatura'] });

        const planoNome = 'Nexsiles Prime';
        const dias = result?.periodo === 'anual' ? 365 : 30;

        // Send welcome email
        enviarNotificacaoEmail('boas_vindas' as any, {
          plano_nome: planoNome,
          dias_validade: dias,
          is_trial: false,
        });

        if (!result?.reaproveitado) {
          toast.success(`🎉 Assinatura ${planoNome} ativada!`, {
            description: `Seu plano está ativo por ${dias} dias.`,
            duration: 6000,
          });
        }
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
