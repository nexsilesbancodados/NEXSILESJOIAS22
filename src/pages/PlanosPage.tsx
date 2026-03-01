import { useState, useEffect } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Crown, 
  Check, 
  Sparkles, 
  Zap,
  ArrowRight,
  Loader2,
  CreditCard,
  ShoppingBag,
  Bot,
  Gift
} from 'lucide-react';
import { useAssinatura, PLANOS, PlanoKey } from '@/hooks/useAssinatura';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MercadoPagoCheckout } from '@/components/checkout/MercadoPagoCheckout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const PLAN_CONFIGS: Record<PlanoKey, {
  icon: typeof Zap;
  color: string;
  bgColor: string;
  borderColor: string;
  checkColor: string;
  popular?: boolean;
  complete?: boolean;
}> = {
  ecommerce_premium: {
    icon: ShoppingBag,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/50',
    checkColor: 'text-emerald-400 bg-emerald-400/10',
  },
  nexsiles: {
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-border',
    checkColor: 'text-primary bg-primary/10',
  },
  nexsiles_ysis: {
    icon: Bot,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/50',
    checkColor: 'text-warning bg-warning/10',
    popular: true,
  },
  nexsiles_commerce: {
    icon: ShoppingBag,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400/50',
    checkColor: 'text-cyan-400 bg-cyan-400/10',
    complete: true,
  },
};

export default function PlanosPage() {
  const { assinatura, planoInfo, isAtivo, dataVencimentoFormatada, diasRestantes, isExpirando, isExpirado } = useAssinatura();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAnual, setIsAnual] = useState(false);
  const [loadingTrial, setLoadingTrial] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanoKey>('nexsiles');

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Pagamento realizado com sucesso!', {
        description: 'Sua assinatura foi ativada. Aproveite todas as funcionalidades!'
      });
      setSearchParams({});
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Pagamento cancelado', {
        description: 'Você pode tentar novamente quando quiser.'
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const getPrecoComDesconto = (preco: number) => {
    if (isAnual) return (preco * 12 * 0.8) / 12;
    return preco;
  };

  const getValorCheckout = (plano: PlanoKey) => {
    const valor = PLANOS[plano].valor;
    if (isAnual) return Math.round(valor * 12 * 0.8);
    return valor;
  };

  // Activate trial directly for a specific plan
  const handleActivateTrial = async (plano: PlanoKey) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para ativar o trial');
      return;
    }

    setLoadingTrial(plano);

    try {
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 3);

      const planoData = PLANOS[plano];

      // Check existing subscription
      const { data: existingSub } = await supabase
        .from('assinaturas')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSub) {
        const { error } = await supabase
          .from('assinaturas')
          .update({
            trial_ativo: true,
            trial_iniciado_em: now.toISOString(),
            trial_dias: 3,
            data_inicio: now.toISOString(),
            data_vencimento: trialEndDate.toISOString(),
            status: 'ativo',
            plano: plano,
            valor_mensal: 0,
          })
          .eq('id', existingSub.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('assinaturas')
          .insert({
            user_id: user.id,
            trial_ativo: true,
            trial_iniciado_em: now.toISOString(),
            trial_dias: 3,
            data_inicio: now.toISOString(),
            data_vencimento: trialEndDate.toISOString(),
            status: 'ativo',
            plano: plano,
            valor_mensal: 0,
          });

        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['assinatura'] });

      toast.success(`🎉 Teste grátis do ${planoData.nome} ativado!`, {
        description: 'Você tem 3 dias para explorar todas as funcionalidades!'
      });
    } catch (error) {
      console.error('Error activating trial:', error);
      toast.error('Erro ao ativar teste grátis', {
        description: 'Por favor, tente novamente.'
      });
    } finally {
      setLoadingTrial(null);
    }
  };

  // Open checkout for paid subscription
  const handleSelectPlan = (plano: PlanoKey) => {
    setSelectedPlan(plano);
    setCheckoutOpen(true);
  };

  const planoAtual = assinatura?.plano as PlanoKey | undefined;

  // Active subscription view
  if (assinatura && isAtivo) {
    return (
      <div className="min-h-screen">
        <PageHeader icon={Crown} title="Meu Plano" subtitle="Gerencie sua assinatura" />

        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={cn(
              "border-2 overflow-hidden",
              isExpirando ? "border-warning/50" : "border-success/30"
            )}>
              <div className={cn(
                "h-2 w-full",
                isExpirando 
                  ? "bg-gradient-to-r from-warning to-warning/60" 
                  : "bg-gradient-to-r from-success to-success/60"
              )} />
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-6">
                  <div className={cn(
                    "mx-auto w-16 h-16 rounded-2xl flex items-center justify-center",
                    isExpirando ? "bg-warning/10" : "bg-success/10"
                  )}>
                    <Crown className={cn("w-8 h-8", isExpirando ? "text-warning" : "text-success")} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Plano {planoInfo?.nome}
                      {assinatura.trial_ativo && (
                        <Badge variant="secondary" className="ml-2 text-xs">Trial</Badge>
                      )}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      {assinatura.trial_ativo ? 'Teste Grátis' : `R$ ${planoInfo?.valor.toFixed(2).replace('.', ',')}/mês`}
                    </p>
                  </div>

                  <div className={cn(
                    "inline-flex items-center gap-3 px-6 py-4 rounded-2xl",
                    isExpirando ? "bg-warning/10 border border-warning/20" : "bg-success/10 border border-success/20"
                  )}>
                    <div className="text-center">
                      <p className={cn("text-4xl font-bold", isExpirando ? "text-warning" : "text-success")}>
                        {diasRestantes}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {assinatura.trial_ativo 
                      ? `Trial ativo até ${dataVencimentoFormatada}`
                      : `Válido até ${dataVencimentoFormatada}`}
                  </p>

                  <div className="text-left max-w-sm mx-auto">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Recursos inclusos:</p>
                    <ul className="space-y-2">
                      {planoInfo?.recursos.map((recurso, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-success flex-shrink-0" />
                          {recurso}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    {(isExpirando || isExpirado || assinatura.trial_ativo) && (
                      <Button
                        onClick={() => handleSelectPlan(planoAtual || 'nexsiles')}
                        className="gap-2 bg-gradient-to-r from-warning to-warning/80"
                      >
                        <Sparkles className="w-4 h-4" />
                        {assinatura.trial_ativo ? 'Assinar Agora' : 'Renovar Agora'}
                      </Button>
                    )}
                    {planoAtual && planoAtual !== 'nexsiles_commerce' && (
                      <Button
                        variant={isExpirando ? "outline" : "default"}
                        onClick={() => handleSelectPlan(
                          planoAtual === 'nexsiles' ? 'nexsiles_ysis' : 'nexsiles_commerce'
                        )}
                        className="gap-2"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Fazer Upgrade
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <MercadoPagoCheckout
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            plano={selectedPlan}
            periodo={isAnual ? 'anual' : 'mensal'}
            valor={getValorCheckout(selectedPlan)}
            planoNome={PLANOS[selectedPlan].nome}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader icon={Crown} title="Escolha seu Plano" subtitle="3 dias de teste grátis em todos os planos. Cancele quando quiser." />

      {/* Expired banner */}
      {assinatura && !isAtivo && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto mb-8">
          <Card className="border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-destructive/10">
                    <CreditCard className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-destructive">Plano {planoInfo?.nome || ''} Expirado</p>
                    <p className="text-sm text-muted-foreground">Renove para continuar usando todas as funcionalidades.</p>
                  </div>
                </div>
                <Button onClick={() => handleSelectPlan(planoAtual || 'nexsiles')} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                  <Sparkles className="w-4 h-4" />
                  Renovar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Toggle Mensal/Anual */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Label htmlFor="billing-toggle" className={cn(!isAnual && 'text-foreground font-semibold')}>Mensal</Label>
        <Switch id="billing-toggle" checked={isAnual} onCheckedChange={setIsAnual} />
        <div className="flex items-center gap-2">
          <Label htmlFor="billing-toggle" className={cn(isAnual && 'text-foreground font-semibold')}>Anual</Label>
          {isAnual && (
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">20% OFF</Badge>
          )}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12 px-4">
        {(Object.entries(PLANOS) as [PlanoKey, typeof PLANOS[PlanoKey]][]).map(([key, plano], index) => {
          const config = PLAN_CONFIGS[key];
          const Icon = config.icon;
          const isCurrent = planoAtual === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-lg h-full flex flex-col",
                config.popular && "border-2 border-warning/50 scale-[1.02] shadow-lg shadow-warning/10",
                config.complete && "border-2 border-cyan-400/50",
                isCurrent && "ring-2 ring-primary",
                !config.popular && !config.complete && "border"
              )}>
                {config.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-warning text-warning-foreground gap-1">
                      <Sparkles className="w-3 h-3" /> Mais Popular
                    </Badge>
                  </div>
                )}
                {config.complete && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-cyan-400/20 text-cyan-400 border-cyan-400/30 gap-1">
                      <Check className="w-3 h-3" /> Completo
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-primary-foreground">Seu Plano</Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    {plano.tier}
                  </p>
                  <CardTitle className="text-2xl mt-1">{plano.nome}</CardTitle>
                  <CardDescription className="text-sm">{plano.descricao}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-5xl font-bold text-foreground">
                        {Math.floor(getPrecoComDesconto(plano.valor))}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {isAnual && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Cobrado R$ {(plano.valor * 12 * 0.8).toFixed(2).replace('.', ',')} anualmente
                      </p>
                    )}
                  </div>

                  {/* Badges */}
                  {'badges' in plano && (plano as any).badges && (
                    <div className="flex gap-2 mb-4">
                      {((plano as any).badges as string[]).map((badge: string) => (
                        <Badge key={badge} variant="outline" className={cn(
                          "text-xs",
                          key === 'ecommerce_premium' && "border-emerald-400/30 text-emerald-400 bg-emerald-400/10",
                          key === 'nexsiles_ysis' && "border-warning/30 text-warning bg-warning/10",
                          key === 'nexsiles_commerce' && "border-cyan-400/30 text-cyan-400 bg-cyan-400/10"
                        )}>
                          {badge === 'IA 24/7' && <Bot className="w-3 h-3 mr-1" />}
                          {badge === 'Loja Virtual' && <ShoppingBag className="w-3 h-3 mr-1" />}
                          {badge === 'IA' && <Bot className="w-3 h-3 mr-1" />}
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Trial CTA - activates trial directly */}
                  {!assinatura && (
                    <Button
                      className={cn(
                        "w-full mb-2 gap-2",
                        key === 'ecommerce_premium' && "bg-emerald-500 hover:bg-emerald-500/90 text-white",
                        key === 'nexsiles_ysis' && "bg-warning hover:bg-warning/90 text-warning-foreground",
                        key === 'nexsiles_commerce' && "bg-cyan-500 hover:bg-cyan-500/90 text-white",
                      )}
                      variant={key === 'nexsiles' ? 'default' : undefined}
                      disabled={isCurrent || loadingTrial === key}
                      onClick={() => handleActivateTrial(key)}
                    >
                      {loadingTrial === key ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Ativando...</>
                      ) : (
                        <><Gift className="w-4 h-4" /> Teste Grátis 3 Dias</>
                      )}
                    </Button>
                  )}

                  {/* Subscribe CTA */}
                  <Button
                    variant="outline"
                    className="w-full mb-6 gap-2"
                    disabled={isCurrent}
                    onClick={() => handleSelectPlan(key)}
                  >
                    {isCurrent ? (
                      'Plano Atual'
                    ) : (
                      <><Zap className="w-4 h-4" /> Assinar agora</>
                    )}
                  </Button>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plano.recursos.map((recurso, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                          config.checkColor
                        )}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-sm text-muted-foreground">{recurso}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="max-w-6xl mx-auto text-center mb-8">
        <p className="text-sm text-muted-foreground">
          Todos os planos incluem 3 dias de teste grátis. Cancele quando quiser.
        </p>
      </div>

      <MercadoPagoCheckout
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        plano={selectedPlan}
        periodo={isAnual ? 'anual' : 'mensal'}
        valor={getValorCheckout(selectedPlan)}
        planoNome={PLANOS[selectedPlan].nome}
      />
    </div>
  );
}
