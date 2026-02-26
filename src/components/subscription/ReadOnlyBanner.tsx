import { useSubscriptionSafe } from '@/contexts/SubscriptionContext';
import { AlertTriangle, Crown, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ReadOnlyBanner() {
  const { isReadOnly, isExpiring, daysRemaining, hasSubscription } = useSubscriptionSafe();
  const navigate = useNavigate();

  if (!isReadOnly && !isExpiring) {
    return null;
  }

  if (isReadOnly) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <Lock className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">
                {hasSubscription ? 'Plano Expirado' : 'Sem Plano Ativo'}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasSubscription 
                  ? 'Seu plano expirou. Renove para continuar usando todas as funcionalidades.'
                  : 'Adquira um plano para usar todas as funcionalidades do sistema.'}
              </p>
            </div>
          </div>
          <Button 
onClick={() => { window.open('https://www.nexsiles.com.br/', '_top'); }}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80"
          >
            <Sparkles className="w-4 h-4" />
            Ver Planos
          </Button>
        </div>
      </div>
    );
  }

  if (isExpiring) {
    return (
      <div className="bg-warning/10 border-b border-warning/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-warning/20">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="font-medium text-warning">Plano Expirando</p>
              <p className="text-sm text-muted-foreground">
                Seu plano vence em {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}. Renove para não perder acesso.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { window.open('https://www.nexsiles.com.br/', '_top'); }}
            className="gap-2 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
          >
            <Crown className="w-4 h-4" />
            Renovar Agora
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
