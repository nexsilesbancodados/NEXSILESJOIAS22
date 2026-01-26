import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Building2,
  Store,
  Package,
  Users,
  Check,
  ArrowRight,
  Rocket,
  Target,
  LayoutDashboard,
  PartyPopper,
  X,
  Phone,
  MapPin,
  User
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
    id: 'store',
    title: 'Dados da Loja',
    description: 'Informações que aparecem nos recibos',
    icon: Store,
  },
  {
    id: 'goals',
    title: 'Meta de Vendas',
    description: 'Defina sua meta mensal',
    icon: Target,
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

  // Form states - Store data
  const [storeData, setStoreData] = useState({
    nome_loja: '',
    telefone_loja: '',
    endereco_loja: '',
    cnpj_loja: '',
    tipo_pessoa: 'pj' as 'pf' | 'pj',
  });

  // Form states - Goals
  const [metaMensal, setMetaMensal] = useState('');

  const step = WIZARD_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const progress = ((currentStep) / (WIZARD_STEPS.length - 1)) * 100;
  const Icon = step.icon;

  const handleNext = async () => {
    // Save store data when leaving store step
    if (currentStep === 1 && storeData.nome_loja) {
      await saveStoreData();
    }

    // Save goals when leaving goals step
    if (currentStep === 2 && metaMensal) {
      await saveGoalsData();
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

  const saveStoreData = async () => {
    if (!storeData.nome_loja) return;

    setIsSubmitting(true);
    try {
      // Save each config key individually using upsert
      const configs = [
        { chave: 'nome_loja', valor: storeData.nome_loja },
        { chave: 'telefone_loja', valor: storeData.telefone_loja },
        { chave: 'endereco_loja', valor: storeData.endereco_loja },
        { chave: 'tipo_pessoa', valor: storeData.tipo_pessoa },
        { chave: storeData.tipo_pessoa === 'pf' ? 'cpf_loja' : 'cnpj_loja', valor: storeData.cnpj_loja },
      ];

      for (const config of configs) {
        // Check if exists
        const { data: existing } = await supabase
          .from('configuracoes')
          .select('id')
          .eq('chave', config.chave)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('configuracoes')
            .update({ valor: config.valor, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('configuracoes')
            .insert({ chave: config.chave, valor: config.valor, tipo: 'string' });
        }
      }

      // Also update profile name if empty
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome')
          .eq('user_id', user.id)
          .single();

        if (profile && (!profile.nome || profile.nome === user.email)) {
          await supabase
            .from('profiles')
            .update({ nome: storeData.nome_loja })
            .eq('user_id', user.id);
        }
      }

    } catch (error) {
      console.error('Erro ao salvar dados da loja:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveGoalsData = async () => {
    if (!metaMensal) return;

    setIsSubmitting(true);
    try {
      // Save meta config
      const { data: existing } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('chave', 'meta_faturamento_mensal')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('configuracoes')
          .update({ valor: metaMensal, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('configuracoes')
          .insert({ chave: 'meta_faturamento_mensal', valor: metaMensal, tipo: 'number' });
      }

      // Also create a meta record
      await supabase
        .from('metas')
        .insert({
          titulo: 'Meta Mensal de Vendas',
          valor_meta: parseFloat(metaMensal),
          tipo: 'vendas',
          data_inicio: new Date().toISOString().slice(0, 10),
          data_fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
        });

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPage = (path: string) => {
    handleComplete();
    setTimeout(() => navigate(path), 300);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Store step - at least name required
        return storeData.nome_loja.trim().length > 0;
      default:
        return true;
    }
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
                    <StoreStep 
                      data={storeData} 
                      onChange={setStoreData} 
                    />
                  )}
                  {currentStep === 2 && (
                    <GoalsStep 
                      value={metaMensal} 
                      onChange={setMetaMensal} 
                    />
                  )}
                  {currentStep === 3 && <CompleteStep onGoTo={goToPage} />}
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
                  disabled={isSubmitting || !canProceed()}
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
        Vamos configurar seu sistema em poucos passos!
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

interface StoreStepProps {
  data: { nome_loja: string; telefone_loja: string; endereco_loja: string; cnpj_loja: string; tipo_pessoa: 'pf' | 'pj' };
  onChange: (data: { nome_loja: string; telefone_loja: string; endereco_loja: string; cnpj_loja: string; tipo_pessoa: 'pf' | 'pj' }) => void;
}

function StoreStep({ data, onChange }: StoreStepProps) {
  const isPessoaFisica = data.tipo_pessoa === 'pf';

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const handleDocumentoChange = (value: string) => {
    const formatted = isPessoaFisica ? formatCPF(value) : formatCNPJ(value);
    onChange({ ...data, cnpj_loja: formatted });
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="space-y-2">
        <Label htmlFor="store-name" className="flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          Nome da Loja *
        </Label>
        <Input
          id="store-name"
          placeholder="Ex: Joias da Maria"
          value={data.nome_loja}
          onChange={(e) => onChange({ ...data, nome_loja: e.target.value })}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store-phone" className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          Telefone / WhatsApp
        </Label>
        <Input
          id="store-phone"
          placeholder="(00) 00000-0000"
          value={data.telefone_loja}
          onChange={(e) => onChange({ ...data, telefone_loja: e.target.value })}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store-address" className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Endereço
        </Label>
        <Input
          id="store-address"
          placeholder="Rua, número - Cidade/UF"
          value={data.endereco_loja}
          onChange={(e) => onChange({ ...data, endereco_loja: e.target.value })}
          className="h-11"
        />
      </div>

      {/* Tipo de Pessoa Toggle */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Tipo de Pessoa
        </Label>
        <ToggleGroup 
          type="single" 
          value={data.tipo_pessoa}
          onValueChange={(value) => {
            if (value) {
              onChange({ ...data, tipo_pessoa: value as 'pf' | 'pj', cnpj_loja: '' });
            }
          }}
          className="w-full justify-stretch"
        >
          <ToggleGroupItem 
            value="pf" 
            className="flex-1 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <User className="w-4 h-4" />
            Pessoa Física
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="pj" 
            className="flex-1 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Building2 className="w-4 h-4" />
            Pessoa Jurídica
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="store-documento" className="flex items-center gap-2">
          {isPessoaFisica ? (
            <>
              <User className="w-4 h-4 text-primary" />
              CPF
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4 text-primary" />
              CNPJ
            </>
          )}
        </Label>
        <Input
          id="store-documento"
          placeholder={isPessoaFisica ? "000.000.000-00" : "00.000.000/0000-00"}
          value={data.cnpj_loja}
          onChange={(e) => handleDocumentoChange(e.target.value)}
          className="h-11"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        * Campo obrigatório. Você pode editar depois em Configurações.
      </p>
    </div>
  );
}

interface GoalsStepProps {
  value: string;
  onChange: (value: string) => void;
}

function GoalsStep({ value, onChange }: GoalsStepProps) {
  return (
    <div className="space-y-6 max-w-sm mx-auto text-center">
      <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <Target className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          Defina uma meta de faturamento mensal para acompanhar seu progresso
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
          <Input
            type="number"
            placeholder="10.000"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-14 text-center text-xl font-semibold pl-10"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Este campo é opcional. Você pode configurar depois.
      </p>
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
        <Button variant="outline" onClick={() => onGoTo('/configuracoes')} className="h-10 gap-2 text-sm">
          <Building2 className="w-4 h-4" />
          Configurações
        </Button>
        <Button variant="outline" onClick={() => onGoTo('/pdv')} className="h-10 gap-2 text-sm">
          <ArrowRight className="w-4 h-4" />
          Ir para PDV
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
        // Check if onboarding is completed
        const { data: prefData, error: prefError } = await supabase
          .from('user_preferences')
          .select('valor')
          .eq('user_id', user.id)
          .eq('chave', PREFERENCE_KEYS.ONBOARDING_COMPLETED)
          .maybeSingle();

        if (prefData?.valor === 'true') {
          setShowWizard(false);
          setIsLoading(false);
          return;
        }

        // Also check if store data already exists (returning user)
        const { data: storeData } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'nome_loja')
          .maybeSingle();

        // If store has name, consider onboarding complete
        if (storeData?.valor && storeData.valor.trim() !== '') {
          setShowWizard(false);
        } else {
          // Check localStorage fallback
          const localCompleted = localStorage.getItem('setup_wizard_completed');
          setShowWizard(!localCompleted);
        }
      } catch {
        const localCompleted = localStorage.getItem('setup_wizard_completed');
        setShowWizard(!localCompleted);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(checkWizardStatus, 500);
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
