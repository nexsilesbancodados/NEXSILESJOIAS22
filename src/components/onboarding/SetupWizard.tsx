import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Building2,
  Package,
  Users,
  Check,
  ArrowRight,
  Rocket,
  Target,
  LayoutDashboard,
  PartyPopper,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSaveUserPreference, PREFERENCE_KEYS } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============ STEP DEFINITIONS ============

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Nexsiles!',
    description: 'Configure seu sistema em segundos',
    icon: Sparkles,
  },
  {
    id: 'business',
    title: 'Seu Negócio',
    description: 'Informações básicas',
    icon: Building2,
  },
  {
    id: 'complete',
    title: 'Tudo Pronto!',
    description: 'Seu sistema está configurado',
    icon: PartyPopper,
  },
];

interface SetupWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const savePreference = useSaveUserPreference();

  // Form states
  const [businessData, setBusinessData] = useState({
    nome: '',
    telefone: '',
    metaMensal: '',
  });

  const step = WIZARD_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const progress = ((currentStep) / (WIZARD_STEPS.length - 1)) * 100;
  const Icon = step.icon;

  const handleNext = async () => {
    if (currentStep === 1) {
      await saveBusinessData();
    }

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    setIsVisible(false);
    try {
      await savePreference.mutateAsync({
        chave: PREFERENCE_KEYS.ONBOARDING_COMPLETED,
        valor: 'true',
      });
    } catch (error) {
      localStorage.setItem('setup_wizard_completed', 'true');
    }
    setTimeout(onComplete, 300);
  };

  const saveBusinessData = async () => {
    if (!user?.id || !businessData.nome) return;

    setIsSubmitting(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ nome: businessData.nome, telefone: businessData.telefone })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      if (businessData.metaMensal) {
        await supabase
          .from('metas')
          .insert({
            titulo: 'Meta Mensal de Vendas',
            valor_meta: parseFloat(businessData.metaMensal),
            tipo: 'vendas',
            data_inicio: new Date().toISOString().slice(0, 10),
            data_fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
          });
      }

      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPage = (path: string) => {
    handleComplete();
    setTimeout(() => navigate(path), 300);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-full max-w-lg my-auto"
        >
          <Card className="shadow-2xl border-primary/20 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Progress bar */}
            <div className="h-1 bg-muted flex-shrink-0">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <CardHeader className="pb-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                {/* Step indicators */}
                <div className="flex items-center gap-2">
                  {WIZARD_STEPS.map((s, index) => (
                    <div
                      key={s.id}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm font-medium',
                        index === currentStep
                          ? 'bg-primary text-primary-foreground scale-110'
                          : index < currentStep
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {index < currentStep ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                  ))}
                </div>

                {/* Close button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display">{step.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {step.description}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-6 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 0 && <WelcomeStep />}
                  {currentStep === 1 && (
                    <BusinessStep 
                      data={businessData} 
                      onChange={setBusinessData} 
                    />
                  )}
                  {currentStep === 2 && <CompleteStep onGoTo={goToPage} />}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={isFirstStep || isSubmitting}
                  className={cn(isFirstStep && 'invisible')}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <Button 
                  onClick={handleNext}
                  disabled={isSubmitting || (currentStep === 1 && !businessData.nome)}
                  className="btn-gold min-w-[120px]"
                >
                  {isSubmitting ? (
                    'Salvando...'
                  ) : isLastStep ? (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Começar!
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============ STEP COMPONENTS ============

function WelcomeStep() {
  return (
    <div className="space-y-6 text-center py-4">
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        <FeatureCard icon={Package} title="Peças" description="Gerencie estoque" />
        <FeatureCard icon={Users} title="Revendedoras" description="Gerencie equipe" />
        <FeatureCard icon={Target} title="Metas" description="Acompanhe resultados" />
        <FeatureCard icon={LayoutDashboard} title="Dashboard" description="Visão completa" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Configure rapidamente e comece a usar!
      </p>
    </div>
  );
}

function FeatureCard({ 
  icon: FeatureIcon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-muted/50 border border-border/50 text-left">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
        <FeatureIcon className="w-4 h-4 text-primary" />
      </div>
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

interface BusinessStepProps {
  data: { nome: string; telefone: string; metaMensal: string };
  onChange: (data: { nome: string; telefone: string; metaMensal: string }) => void;
}

function BusinessStep({ data, onChange }: BusinessStepProps) {
  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="space-y-2">
        <Label htmlFor="business-name">Nome da Empresa / Seu Nome *</Label>
        <Input
          id="business-name"
          placeholder="Ex: Joias da Maria"
          value={data.nome}
          onChange={(e) => onChange({ ...data, nome: e.target.value })}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="business-phone">Telefone (WhatsApp)</Label>
        <Input
          id="business-phone"
          placeholder="(00) 00000-0000"
          value={data.telefone}
          onChange={(e) => onChange({ ...data, telefone: e.target.value })}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="business-meta">Meta de Vendas Mensal (R$)</Label>
        <Input
          id="business-meta"
          type="number"
          placeholder="Ex: 10000"
          value={data.metaMensal}
          onChange={(e) => onChange({ ...data, metaMensal: e.target.value })}
          className="h-11"
        />
      </div>
    </div>
  );
}

interface CompleteStepProps {
  onGoTo: (path: string) => void;
}

function CompleteStep({ onGoTo }: CompleteStepProps) {
  return (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-primary" />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-1">Configuração Concluída!</h3>
        <p className="text-sm text-muted-foreground">
          Seu sistema está pronto para uso.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
        <Button variant="outline" onClick={() => onGoTo('/pecas')} className="h-10 gap-2 text-sm">
          <Package className="w-4 h-4" />
          Peças
        </Button>
        <Button variant="outline" onClick={() => onGoTo('/revendedoras')} className="h-10 gap-2 text-sm">
          <Users className="w-4 h-4" />
          Revendedoras
        </Button>
        <Button variant="outline" onClick={() => onGoTo('/pdv')} className="h-10 gap-2 col-span-2 text-sm">
          <ArrowRight className="w-4 h-4" />
          Ir para o PDV
        </Button>
      </div>
    </div>
  );
}

// ============ HOOK ============

export function useSetupWizard() {
  const [showWizard, setShowWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkWizardStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('valor')
          .eq('user_id', user.id)
          .eq('chave', PREFERENCE_KEYS.ONBOARDING_COMPLETED)
          .single();

        if (error && error.code !== 'PGRST116') {
          const localCompleted = localStorage.getItem('setup_wizard_completed');
          setShowWizard(!localCompleted);
        } else {
          setShowWizard(!data?.valor);
        }
      } catch {
        const localCompleted = localStorage.getItem('setup_wizard_completed');
        setShowWizard(!localCompleted);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(checkWizardStatus, 1000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  const resetWizard = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('chave', PREFERENCE_KEYS.ONBOARDING_COMPLETED);
    } catch {
      // Ignorar erro
    }

    localStorage.removeItem('setup_wizard_completed');
    setShowWizard(true);
  };

  return {
    showWizard,
    setShowWizard,
    resetWizard,
    isLoading,
  };
}
