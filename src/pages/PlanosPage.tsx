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
  MessageSquare
} from 'lucide-react';
import { useAssinatura, PLANOS, PlanoKey } from '@/hooks/useAssinatura';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { TrialActivation } from '@/components/subscription/TrialActivation';
import { MercadoPagoCheckout } from '@/components/checkout/MercadoPagoCheckout';

const PLAN_CONFIGS: Record<PlanoKey, {
  icon: typeof Zap;
  color: string;
  bgColor: string;
  borderColor: string;
  checkColor: string;
  popular?: boolean;
  complete?: boolean;
}> = {
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
  const [isAnual, setIsAnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
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

  const handleSelectPlan = (plano: PlanoKey) => {
    setSelectedPlan(plano);
    setCheckoutOpen(true);
  };

  const planoAtual = assinatura?.plano as PlanoKey | undefined;

  // Active subscription view
  if (assinatura && isAtivo) {
    return (
      <>
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
                        R$ {planoInfo?.valor.toFixed(2).replace('.', ',')}/mês
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
                      {(isExpirando || isExpirado) && (
                        <Button
                          onClick={() => handleSelectPlan(planoAtual || 'nexsiles')}
                          className="gap-2 bg-gradient-to-r from-warning to-warning/80"
                        >
                          <Sparkles className="w-4 h-4" />
                          Renovar Agora
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
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <PageHeader icon={Crown} title="Escolha seu Plano" subtitle="3 dias de teste grátis em todos os planos. Cancele quando quiser." />

        {/* Trial for new users */}
        {!assinatura && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mb-8">
            <TrialActivation />
          </motion.div>
        )}

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

        {/* Plan Cards - 3 columns */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12 px-4">
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
                  {/* Popular/Complete ribbons */}
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

                    {/* Trial CTA */}
                    <Button
                      className={cn(
                        "w-full mb-4 gap-2",
                        key === 'nexsiles_ysis' && "bg-warning hover:bg-warning/90 text-warning-foreground",
                        key === 'nexsiles_commerce' && "bg-cyan-500 hover:bg-cyan-500/90 text-white",
                      )}
                      variant={key === 'nexsiles' ? 'default' : undefined}
                      disabled={isCurrent || loadingPlan === key}
                      onClick={() => handleSelectPlan(key)}
                    >
                      {loadingPlan === key ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                      ) : isCurrent ? (
                        'Plano Atual'
                      ) : (
                        <><Zap className="w-4 h-4" /> Teste Grátis 3 Dias</>
                      )}
                    </Button>

                    <button 
                      onClick={() => handleSelectPlan(key)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 flex items-center justify-center gap-1"
                    >
                      Assinar agora <ArrowRight className="w-3 h-3" />
                    </button>

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

        {/* FAQ CTA */}
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <p className="text-muted-foreground mb-4">Dúvidas sobre qual plano escolher? Entre em contato!</p>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Falar com Suporte
          </Button>
        </div>

        {/* Checkout */}
        <MercadoPagoCheckout
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          plano={selectedPlan}
          periodo={isAnual ? 'anual' : 'mensal'}
          valor={getValorCheckout(selectedPlan)}
          planoNome={PLANOS[selectedPlan].nome}
        />
      </div>
    </>
  );
}
