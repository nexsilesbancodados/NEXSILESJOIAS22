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
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/50',
    checkColor: 'text-amber-500 bg-amber-500/10',
  },
  nexsiles_ysis: {
    icon: Bot,
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    borderColor: 'border-slate-400/50',
    checkColor: 'text-slate-400 bg-slate-400/10',
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

  const PRIME = PLANOS.nexsiles;

  return (
    <div className="min-h-screen">
      <PageHeader icon={Crown} title="Nexsiles Prime" subtitle="Plano único com tudo incluso. 3 dias de teste grátis." />

      {/* Expired banner */}
      {assinatura && !isAtivo && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto mb-8 px-4">
          <Card className="border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-destructive/10">
                    <CreditCard className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-destructive">Assinatura Expirada</p>
                    <p className="text-sm text-muted-foreground">Renove para continuar usando todas as funcionalidades.</p>
                  </div>
                </div>
                <Button onClick={() => handleSelectPlan('nexsiles')} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                  <Sparkles className="w-4 h-4" />
                  Renovar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Single Plan Card */}
      <div className="max-w-2xl mx-auto mb-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden border-2 border-primary/50 shadow-xl shadow-primary/10">
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-primary-foreground gap-1">
                <Sparkles className="w-3 h-3" /> Tudo Incluso
              </Badge>
            </div>

            <CardHeader className="pb-4 pt-8">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                {PRIME.tier}
              </p>
              <CardTitle className="text-3xl mt-1">{PRIME.nome}</CardTitle>
              <CardDescription className="text-base">{PRIME.descricao}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col">
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-6xl font-bold text-foreground">
                    {Math.floor(PRIME.valor)}
                  </span>
                  <span className="text-muted-foreground text-lg">/mês</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sem fidelidade. Cancele quando quiser.</p>
              </div>

              {!assinatura && (
                <Button
                  size="lg"
                  className="w-full mb-2 gap-2"
                  disabled={loadingTrial === 'nexsiles'}
                  onClick={() => handleActivateTrial('nexsiles')}
                >
                  {loadingTrial === 'nexsiles' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Ativando...</>
                  ) : (
                    <><Gift className="w-4 h-4" /> Teste Grátis 3 Dias</>
                  )}
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                className="w-full mb-6 gap-2"
                onClick={() => handleSelectPlan('nexsiles')}
              >
                <Zap className="w-4 h-4" /> Assinar agora
              </Button>

              <ul className="grid sm:grid-cols-2 gap-3">
                {PRIME.recursos.map((recurso, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-primary/10 text-primary">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-muted-foreground">{recurso}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Inclui 3 dias de teste grátis. Cancele quando quiser.
          </p>
        </div>
      </div>

      <MercadoPagoCheckout
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        plano={selectedPlan}
        periodo="mensal"
        valor={PRIME.valor}
        planoNome={PRIME.nome}
      />
    </div>
  );
}
