import { Navigate, useLocation } from 'react-router-dom';
import { useAssinatura } from '@/hooks/useAssinatura';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * Guard that locks expired/no-subscription users to /planos only.
 * Allowed routes when expired: /planos, /configuracoes, /super-admin
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { assinatura, isAtivo, isLoading } = useAssinatura();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allowedPaths = ['/planos', '/configuracoes', '/super-admin'];
  const isAllowed = allowedPaths.some(p => location.pathname.startsWith(p));

  // If user has no subscription or is expired, redirect to /planos
  if (!isAtivo && !isAllowed) {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
}
