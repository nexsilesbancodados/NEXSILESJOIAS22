import { createContext, useContext, ReactNode } from 'react';
import { useAssinatura } from '@/hooks/useAssinatura';

interface SubscriptionContextType {
  isReadOnly: boolean;
  isExpired: boolean;
  isExpiring: boolean;
  isActive: boolean;
  hasSubscription: boolean;
  planName: string | null;
  planKey: string | null;
  daysRemaining: number | null;
  checkAccess: (action?: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { 
    assinatura, 
    isExpirado, 
    isExpirando, 
    isAtivo, 
    diasRestantes,
    planoInfo,
    isLoading
  } = useAssinatura();

  // User has no subscription at all
  const hasSubscription = !!assinatura;

  // Read-only mode when expired OR when user has no subscription
  const isReadOnly = !isLoading && (!hasSubscription || isExpirado);

  // Check if user can perform an action
  const checkAccess = (action?: string): boolean => {
    if (isReadOnly) {
      return false;
    }
    return true;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isReadOnly,
        isExpired: isExpirado,
        isExpiring: isExpirando,
        isActive: isAtivo,
        hasSubscription,
        planName: planoInfo?.nome || null,
        planKey: assinatura?.plano || null,
        daysRemaining: diasRestantes,
        checkAccess,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Hook for components that might be outside the provider
export function useSubscriptionSafe() {
  const context = useContext(SubscriptionContext);
  return context ?? {
    isReadOnly: false,
    isExpired: false,
    isExpiring: false,
    isActive: true,
    hasSubscription: true,
    planName: null,
    planKey: null,
    daysRemaining: null,
    checkAccess: () => true,
  };
}
