import { Navigate } from 'react-router-dom';
import { useSubscriptionSafe } from '@/contexts/SubscriptionContext';

/**
 * Guards routes based on the user's active plan.
 * Bronze: no /loja-virtual, no /atendimento
 * Prata: no /loja-virtual
 * E-commerce: only /, /pecas, /loja-virtual, /configuracoes, /planos, /pedidos-loja, /etiquetas
 * Diamante: full access
 */
export function PlanRouteGuard({ children, path }: { children: React.ReactNode; path: string }) {
  const { planKey } = useSubscriptionSafe();

  const bronzeRestricted = ['/loja-virtual', '/atendimento'];
  const prataRestricted = ['/loja-virtual'];
  const ecommerceAllowed = ['/', '/pecas', '/loja-virtual', '/configuracoes', '/planos', '/pedidos-loja', '/etiquetas'];

  if (planKey === 'nexsiles' && bronzeRestricted.some(p => path.startsWith(p))) {
    return <Navigate to="/" replace />;
  }

  if (planKey === 'nexsiles_ysis' && prataRestricted.some(p => path.startsWith(p))) {
    return <Navigate to="/" replace />;
  }

  if (planKey === 'ecommerce_premium' && !ecommerceAllowed.some(p => path === p || (p !== '/' && path.startsWith(p)))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
