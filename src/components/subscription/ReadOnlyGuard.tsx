import { ReactNode } from 'react';
import { useSubscriptionSafe } from '@/contexts/SubscriptionContext';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReadOnlyGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showTooltip?: boolean;
}

/**
 * Wraps components that should be disabled in read-only mode.
 * When the subscription is expired, it disables the children and optionally shows a tooltip.
 */
export function ReadOnlyGuard({ 
  children, 
  fallback,
  showTooltip = true 
}: ReadOnlyGuardProps) {
  const { isReadOnly } = useSubscriptionSafe();

  if (!isReadOnly) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex opacity-50 cursor-not-allowed">
              <div className="pointer-events-none">
                {children}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            <Lock className="w-3 h-3" />
            <span>Plano expirado - Renove para editar</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="inline-flex opacity-50 cursor-not-allowed pointer-events-none">
      {children}
    </div>
  );
}

interface ReadOnlyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

/**
 * A button that is automatically disabled in read-only mode.
 * Shows a tooltip explaining why it's disabled.
 */
export function ReadOnlyButton({ 
  children, 
  onClick, 
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  ...props
}: ReadOnlyButtonProps) {
  const { isReadOnly } = useSubscriptionSafe();
  const navigate = useNavigate();

  if (isReadOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
              disabled
              {...props}
            >
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex flex-col items-start gap-2 p-3">
            <div className="flex items-center gap-2 text-destructive">
              <Lock className="w-3 h-3" />
              <span className="font-medium">Plano expirado</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Renove seu plano para continuar editando
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full mt-1 gap-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/configuracoes');
              }}
            >
              <Crown className="w-3 h-3" />
              Renovar
            </Button>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * Hook to get read-only aware handlers
 */
export function useReadOnlyAction() {
  const { isReadOnly, checkAccess } = useSubscriptionSafe();
  const navigate = useNavigate();

  const guardAction = <T extends (...args: unknown[]) => unknown>(
    action: T,
    options?: { showAlert?: boolean }
  ): T | (() => void) => {
    if (isReadOnly) {
      return () => {
        if (options?.showAlert !== false) {
          // Could show a toast here
          navigate('/configuracoes');
        }
      };
    }
    return action;
  };

  return {
    isReadOnly,
    checkAccess,
    guardAction,
  };
}
