import { useSubscriptionSafe } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

interface UseReadOnlyGuardOptions {
  showToast?: boolean;
  redirectToLanding?: boolean;
}

export function useReadOnlyGuard(options: UseReadOnlyGuardOptions = {}) {
  const { showToast = true, redirectToLanding = true } = options;
  const { isReadOnly, isExpired, isExpiring, daysRemaining } = useSubscriptionSafe();
  const navigate = useNavigate();

  const checkAccess = useCallback((actionName?: string) => {
    if (isReadOnly) {
      if (showToast) {
        toast.error('Acesso restrito', {
          description: actionName 
            ? `Não é possível ${actionName}. Adquira um plano para continuar.`
            : 'Você precisa de um plano ativo para usar esta função.',
        });
      }
      
      if (redirectToLanding) {
        window.open('https://www.nexsiles.online', '_blank');
      }
      
      return false;
    }
    return true;
  }, [isReadOnly, showToast, redirectToLanding, navigate]);

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

  // Redirect immediately if in read-only mode and user tries to access protected area
  const redirectIfReadOnly = useCallback(() => {
    if (isReadOnly) {
      window.open('https://www.nexsiles.online', '_blank');
      return true;
    }
    return false;
  }, [isReadOnly, navigate]);

  return {
    isReadOnly,
    isExpired,
    isExpiring,
    daysRemaining,
    checkAccess,
    guardedAction,
    redirectIfReadOnly,
  };
}
