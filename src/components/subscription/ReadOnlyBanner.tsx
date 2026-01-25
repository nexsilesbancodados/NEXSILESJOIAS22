import { useSubscriptionSafe } from '@/contexts/SubscriptionContext';
import { AlertTriangle, Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ReadOnlyBanner() {
  const { isReadOnly, isExpiring, daysRemaining } = useSubscriptionSafe();
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
              <p className="font-medium text-destructive">Modo Leitura Ativado</p>
              <p className="text-sm text-muted-foreground">
                Seu plano expirou. Você pode visualizar seus dados, mas não pode criar ou editar.
              </p>
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => navigate('/configuracoes')}
            className="gap-2"
          >
            <Crown className="w-4 h-4" />
            Renovar Plano
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
            onClick={() => navigate('/configuracoes')}
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
