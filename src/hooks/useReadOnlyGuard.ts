import { useSubscriptionSafe } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

interface UseReadOnlyGuardOptions {
  showToast?: boolean;
  redirectToPlanos?: boolean;
}

export function useReadOnlyGuard(options: UseReadOnlyGuardOptions = {}) {
  const { showToast = true, redirectToPlanos = false } = options;
  const { isReadOnly, isExpired, isExpiring, daysRemaining } = useSubscriptionSafe();
  const navigate = useNavigate();

  const checkAccess = useCallback((actionName?: string) => {
    if (isReadOnly) {
      if (showToast) {
        toast.error('Acesso restrito', {
          description: actionName 
            ? `Não é possível ${actionName} no modo leitura. Renove seu plano para continuar.`
            : 'Seu plano expirou. Renove para continuar editando.',
          action: {
            label: 'Ver Planos',
            onClick: () => navigate('/planos'),
          },
        });
      }
      
      if (redirectToPlanos) {
        navigate('/planos');
      }
      
      return false;
    }
    return true;
  }, [isReadOnly, showToast, redirectToPlanos, navigate]);

  const guardedAction = useCallback(<T extends (...args: any[]) => any>(
    action: T,
    actionName?: string
  ) => {
    return ((...args: Parameters<T>) => {
      if (!checkAccess(actionName)) {
        return;
      }
      return action(...args);
    }) as T;
  }, [checkAccess]);

  return {
    isReadOnly,
    isExpired,
    isExpiring,
    daysRemaining,
    checkAccess,
    guardedAction,
  };
}
