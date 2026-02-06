import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  CreditCard, 
  RefreshCw,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useAssinatura } from '@/hooks/useAssinatura';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SubscriptionStatus() {
  const navigate = useNavigate();
  const { 
    assinatura, 
    planoInfo, 
    isAtivo, 
    isExpirando, 
    isExpirado,
    diasRestantes,
    dataVencimentoFormatada 
  } = useAssinatura();

  if (!assinatura) {
    return null;
  }

  const isTrial = assinatura.trial_ativo;
  const trialProgress = isTrial && diasRestantes !== null 
    ? Math.max(0, Math.min(100, ((3 - diasRestantes) / 3) * 100))
    : 0;

  const getStatusBadge = () => {
    if (isExpirado) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Expirado
        </Badge>
      );
    }
    if (isExpirando) {
      return (
        <Badge variant="outline" className="border-warning text-warning gap-1">
          <Clock className="w-3 h-3" />
          Expira em {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''}
        </Badge>
      );
    }
    if (isTrial) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
          <Sparkles className="w-3 h-3" />
          Período de Teste
        </Badge>
      );
    }
    return (
      <Badge className="bg-success/10 text-success border-success/20 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Ativo
      </Badge>
    );
  };

  return (
    <Card className={cn(
      "transition-all",
      isExpirado && "border-destructive/50 bg-destructive/5",
      isExpirando && "border-warning/50 bg-warning/5",
      isTrial && !isExpirando && !isExpirado && "border-primary/50 bg-primary/5"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl",
              isExpirado ? "bg-destructive/10" : 
              isExpirando ? "bg-warning/10" : 
              isTrial ? "bg-primary/10" : "bg-success/10"
            )}>
              <Crown className={cn(
                "w-5 h-5",
                isExpirado ? "text-destructive" : 
                isExpirando ? "text-warning" : 
                isTrial ? "text-primary" : "text-success"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg">
                {planoInfo?.nome || 'Sem Plano'}
                {isTrial && ' (Trial)'}
              </CardTitle>
              <CardDescription>
                {isTrial ? 'Teste grátis de 3 dias' : planoInfo?.descricao}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trial Progress */}
        {isTrial && !isExpirado && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso do trial</span>
              <span className="font-medium">
                {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''}
              </span>
            </div>
            <Progress value={trialProgress} className="h-2" />
          </div>
        )}

        {/* Subscription Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Vencimento</p>
              <p className="font-medium">{dataVencimentoFormatada}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Valor</p>
              <p className="font-medium">
                {isTrial ? 'Grátis' : `R$ ${planoInfo?.valor.toFixed(2).replace('.', ',')}/mês`}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method Info */}
        {assinatura.metodo_pagamento && !isTrial && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Pagamento via {assinatura.metodo_pagamento === 'cartao' ? 'Cartão de Crédito' : 
                           assinatura.metodo_pagamento === 'pix' ? 'PIX' : 'Boleto'}
              {assinatura.pagamento_recorrente && ' (Recorrente)'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {(isExpirado || isExpirando || isTrial) && (
            <Button 
              onClick={() => navigate('/planos')}
              className={cn(
                "flex-1",
                !isExpirado && "btn-gold"
              )}
              variant={isExpirado ? "destructive" : "default"}
            >
              <Crown className="w-4 h-4 mr-2" />
              {isExpirado ? 'Renovar Agora' : isTrial ? 'Escolher Plano' : 'Renovar'}
            </Button>
          )}
          
          {!isExpirado && !isTrial && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/planos')}
              className="flex-1"
            >
              Ver Planos
            </Button>
          )}
        </div>

        {/* Warning for expiring/expired */}
        {isExpirado && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Seu acesso está em modo somente leitura
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              Renove seu plano para voltar a criar e editar dados.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
