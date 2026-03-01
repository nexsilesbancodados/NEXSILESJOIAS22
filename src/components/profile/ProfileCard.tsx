import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssinatura, PLANOS } from '@/hooks/useAssinatura';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Crown, 
  Zap, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Sparkles,
  MessageCircle,
  BarChart3,
  Package,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  className?: string;
}

export function ProfileCard({ className }: ProfileCardProps) {
  const { user, profile, signOut } = useAuth();
  const { 
    assinatura, 
    isLoading, 
    diasRestantes, 
    isExpirando, 
    isExpirado,
    isAtivo,
    dataVencimentoFormatada,
    planoInfo 
  } = useAssinatura();

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <Badge variant="outline" className="gap-1 border-warning text-warning">
          <Clock className="w-3 h-3" />
          Expira em {diasRestantes} dias
        </Badge>
      );
    }
    if (isAtivo) {
      return (
        <Badge variant="outline" className="gap-1 border-success text-success">
          <CheckCircle className="w-3 h-3" />
          Ativo
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        Sem plano
      </Badge>
    );
  };

  const getPlanIcon = () => {
    if (assinatura?.plano === 'nexsiles_commerce' || assinatura?.plano === 'nexsiles_ysis') {
      return <Crown className="w-5 h-5 text-chart-4" />;
    }
    return <Zap className="w-5 h-5 text-primary" />;
  };

  const progressValue = diasRestantes !== null && diasRestantes > 0
    ? Math.min(100, (diasRestantes / 30) * 100)
    : 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header with gradient based on plan */}
      <div className={cn(
        "p-6 text-primary-foreground",
        (assinatura?.plano === 'nexsiles_commerce' || assinatura?.plano === 'nexsiles_ysis')
          ? "bg-gradient-to-r from-chart-4 to-chart-5" 
          : "bg-gradient-to-r from-primary to-primary/80"
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary-foreground/50">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xl">
                {profile?.nome?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">
                {profile?.nome || 'Usuário'}
              </h2>
              <p className="text-primary-foreground/80 text-sm">
                {user?.email}
              </p>
            </div>
          </div>
          {getPlanIcon()}
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Plan Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              {(assinatura?.plano === 'nexsiles_commerce' || assinatura?.plano === 'nexsiles_ysis') ? (
                <Crown className="w-5 h-5 text-chart-4" />
              ) : (
                <Zap className="w-5 h-5 text-primary" />
              )}
              <span className="font-semibold text-lg">
                {planoInfo?.nome || 'Sem Plano'}
              </span>
            </div>
            {getStatusBadge()}
          </div>

          {assinatura && (
            <>
              <p className="text-sm text-muted-foreground">
                {planoInfo?.descricao}
              </p>

              {/* Expiration Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tempo restante</span>
                  <span className={cn(
                    "font-medium",
                    isExpirado && "text-destructive",
                    isExpirando && "text-warning",
                  )}>
                    {isExpirado 
                      ? 'Expirado' 
                      : `${diasRestantes} dias`
                    }
                  </span>
                </div>
                <Progress 
                  value={progressValue} 
                  className={cn(
                    "h-2",
                    isExpirado && "[&>div]:bg-destructive",
                    isExpirando && "[&>div]:bg-warning",
                  )}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Vence em {dataVencimentoFormatada}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  R$ {planoInfo?.valor.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Plan Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Recursos do plano</h4>
          <ul className="space-y-2">
            {(planoInfo?.recursos || PLANOS.nexsiles.recursos).map((recurso, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span>{recurso}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Max Plan Exclusive Features */}
        {(assinatura?.plano === 'nexsiles_ysis' || assinatura?.plano === 'nexsiles_commerce') && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-chart-4" />
                <h4 className="font-medium text-sm">Recursos Exclusivos Max</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-chart-4/10">
                  <MessageCircle className="w-5 h-5 text-chart-4" />
                  <span className="text-sm font-medium">Chatbot WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-chart-4/10">
                  <Sparkles className="w-5 h-5 text-chart-4" />
                  <span className="text-sm font-medium">Atendente IA</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Upgrade CTA for basic plan */}
        {assinatura?.plano === 'nexsiles' && (
          <>
            <Separator />
            <Card className="border-chart-4/30 bg-gradient-to-r from-chart-4/10 to-chart-5/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Crown className="w-8 h-8 text-chart-4 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-semibold">Upgrade para Nexsiles Max</h4>
                    <p className="text-sm text-muted-foreground">
                      Desbloqueie o atendente de IA e chatbot WhatsApp para automatizar seu atendimento!
                    </p>
                    <Button size="sm" className="bg-gradient-to-r from-chart-4 to-chart-5 text-primary-foreground hover:opacity-90">
                      <Crown className="w-4 h-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* No subscription CTA */}
        {!assinatura && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="space-y-3 text-center">
                <Zap className="w-10 h-10 text-primary mx-auto" />
                <div>
                  <h4 className="font-semibold">Comece a usar o Nexsiles</h4>
                  <p className="text-sm text-muted-foreground">
                    Escolha um plano e desbloqueie todas as funcionalidades
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">Ver Planos</Button>
                  <Button>Assinar Agora</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expired Warning */}
        {isExpirado && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-destructive">Plano Expirado</h4>
                  <p className="text-sm text-muted-foreground">
                    Seu plano expirou e o sistema está em modo leitura. Renove para continuar criando e editando.
                  </p>
                  <Button variant="destructive" size="sm">
                    Renovar Agora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiring Soon Warning */}
        {isExpirando && !isExpirado && (
          <Card className="border-warning/50 bg-warning/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-warning flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-warning">Plano Expirando</h4>
                  <p className="text-sm text-muted-foreground">
                    Seu plano vence em {diasRestantes} dias. Renove para não perder acesso.
                  </p>
                  <Button variant="outline" size="sm" className="border-warning text-warning hover:bg-warning hover:text-warning-foreground">
                    Renovar Agora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign out */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => signOut()}
        >
          Sair da Conta
        </Button>
      </CardContent>
    </Card>
  );
}
