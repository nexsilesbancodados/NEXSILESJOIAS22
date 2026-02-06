import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, Clock, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface TrialActivationProps {
  onActivated?: () => void;
}

export function TrialActivation({ onActivated }: TrialActivationProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isActivating, setIsActivating] = useState(false);

  const handleActivateTrial = async () => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para ativar o trial');
      return;
    }

    setIsActivating(true);

    try {
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 3); // 3 dias de trial

      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from('assinaturas')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('assinaturas')
          .update({
            trial_ativo: true,
            trial_iniciado_em: now.toISOString(),
            trial_dias: 3,
            data_inicio: now.toISOString(),
            data_vencimento: trialEndDate.toISOString(),
            status: 'ativo',
            plano: 'nexsiles', // Trial comes with basic plan
          })
          .eq('id', existingSubscription.id);

        if (error) throw error;
      } else {
        // Create new subscription with trial
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
            plano: 'nexsiles',
            valor_mensal: 0,
          });

        if (error) throw error;
      }

      // Invalidate queries to refresh subscription data
      await queryClient.invalidateQueries({ queryKey: ['assinatura'] });

      toast.success('🎉 Teste grátis ativado!', {
        description: 'Você tem 3 dias para explorar todas as funcionalidades do Nexsiles!'
      });

      onActivated?.();
    } catch (error) {
      console.error('Error activating trial:', error);
      toast.error('Erro ao ativar teste grátis', {
        description: 'Por favor, tente novamente ou entre em contato com o suporte.'
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            Experimente Grátis!
            <Sparkles className="w-6 h-6 text-warning" />
          </CardTitle>
          <CardDescription className="text-base">
            Ative seu teste grátis de 3 dias e explore todas as funcionalidades
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <div className="p-2 rounded-full bg-success/10">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm">Acesso completo</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <div className="p-2 rounded-full bg-success/10">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm">Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <div className="p-2 rounded-full bg-success/10">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm">Cancele quando quiser</span>
            </div>
          </div>

          {/* Timer visual */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">3 dias de acesso completo</span>
            <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
              Grátis
            </Badge>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={handleActivateTrial}
            disabled={isActivating}
            className="w-full h-12 text-lg btn-gold"
          >
            {isActivating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <Gift className="w-5 h-5 mr-2" />
                Iniciar Teste Grátis
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Após o período de teste, você poderá escolher um plano ou continuar em modo leitura.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
