import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  optional?: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Nexsiles!',
    description: 'Vamos configurar seu sistema em poucos passos',
    icon: Sparkles,
  },
  {
    id: 'business',
    title: 'Seu Negócio',
    description: 'Informações básicas da sua empresa',
    icon: Building2,
  },
  {
    id: 'first-piece',
    title: 'Primeira Peça',
    description: 'Cadastre sua primeira semijoia',
    icon: Package,
    optional: true,
  },
  {
    id: 'first-seller',
    title: 'Primeira Revendedora',
    description: 'Adicione sua primeira revendedora',
    icon: Users,
    optional: true,
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

  const [pieceData, setPieceData] = useState({
    nome: '',
    codigo: '',
    precoVenda: '',
    estoque: '',
  });

  const [sellerData, setSellerData] = useState({
    nome: '',
    telefone: '',
    email: '',
  });

  const step = WIZARD_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const progress = ((currentStep) / (WIZARD_STEPS.length - 1)) * 100;
  const Icon = step.icon;

  const handleNext = async () => {
    if (currentStep === 1) {
      // Salvar dados do negócio
      await saveBusinessData();
    } else if (currentStep === 2 && pieceData.nome) {
      // Salvar primeira peça se preenchida
      await saveFirstPiece();
    } else if (currentStep === 3 && sellerData.nome) {
      // Salvar primeira revendedora se preenchida
      await saveFirstSeller();
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

  const handleSkipStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleComplete = async () => {
    setIsVisible(false);
    // Salvar no banco de dados que o wizard foi completado
    try {
      await savePreference.mutateAsync({
        chave: PREFERENCE_KEYS.ONBOARDING_COMPLETED,
        valor: 'true',
      });
    } catch (error) {
      // Fallback para localStorage se falhar
      localStorage.setItem('setup_wizard_completed', 'true');
    }
    setTimeout(onComplete, 300);
  };

  const saveBusinessData = async () => {
    if (!user?.id || !businessData.nome) return;

    setIsSubmitting(true);
    try {
      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ nome: businessData.nome, telefone: businessData.telefone })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Salvar meta mensal se informada
      if (businessData.metaMensal) {
        const { error: metaError } = await supabase
          .from('metas')
          .insert({
            titulo: 'Meta Mensal de Vendas',
            valor_meta: parseFloat(businessData.metaMensal),
            tipo: 'vendas',
            data_inicio: new Date().toISOString().slice(0, 10),
            data_fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
          });

        if (metaError) console.error('Erro ao criar meta:', metaError);
      }

      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveFirstPiece = async () => {
    if (!pieceData.nome) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pecas')
        .insert({
          nome: pieceData.nome,
          codigo: pieceData.codigo || null,
          preco_venda: pieceData.precoVenda ? parseFloat(pieceData.precoVenda) : null,
          estoque: pieceData.estoque ? parseInt(pieceData.estoque) : 0,
          ativo: true,
        });

      if (error) throw error;
      toast.success('Primeira peça cadastrada!');
    } catch (error) {
      console.error('Erro ao cadastrar peça:', error);
      toast.error('Erro ao cadastrar peça');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveFirstSeller = async () => {
    if (!sellerData.nome) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('revendedoras')
        .insert({
          nome: sellerData.nome,
          telefone: sellerData.telefone || null,
          email: sellerData.email || null,
          ativo: true,
          comissao_percentual: 30, // Comissão padrão
        });

      if (error) throw error;
      toast.success('Primeira revendedora cadastrada!');
    } catch (error) {
      console.error('Erro ao cadastrar revendedora:', error);
      toast.error('Erro ao cadastrar revendedora');
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
          className="w-full max-w-2xl my-auto"
        >
          <Card className="shadow-2xl border-primary/20 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Progress bar */}
            <div className="h-1 bg-muted">
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
                  {step.optional && (
                    <Badge variant="secondary" className="ml-2">Opcional</Badge>
                  )}
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
                  {/* Step Content */}
                  {currentStep === 0 && (
                    <WelcomeStep />
                  )}

                  {currentStep === 1 && (
                    <BusinessStep 
                      data={businessData} 
                      onChange={setBusinessData} 
                    />
                  )}

                  {currentStep === 2 && (
                    <PieceStep 
                      data={pieceData} 
                      onChange={setPieceData} 
                    />
                  )}

                  {currentStep === 3 && (
                    <SellerStep 
                      data={sellerData} 
                      onChange={setSellerData} 
                    />
                  )}

                  {currentStep === 4 && (
                    <CompleteStep onGoTo={goToPage} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={isFirstStep || isSubmitting}
                  className={cn(isFirstStep && 'invisible')}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-2">
                  {step.optional && !isLastStep && (
                    <Button 
                      variant="ghost" 
                      onClick={handleSkipStep}
                      disabled={isSubmitting}
                      className="text-muted-foreground"
                    >
                      Pular etapa
                    </Button>
                  )}

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
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <FeatureCard 
          icon={Package} 
          title="Gestão de Peças" 
          description="Controle seu estoque" 
        />
        <FeatureCard 
          icon={Users} 
          title="Revendedoras" 
          description="Gerencie sua equipe" 
        />
        <FeatureCard 
          icon={Target} 
          title="Metas" 
          description="Acompanhe resultados" 
        />
        <FeatureCard 
          icon={LayoutDashboard} 
          title="Dashboard" 
          description="Visão completa" 
        />
      </div>

      <p className="text-muted-foreground max-w-md mx-auto">
        Em poucos minutos você terá seu sistema configurado e pronto para uso.
        Vamos começar?
      </p>
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-left">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
        <Icon className="w-5 h-5 text-primary" />
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
    <div className="space-y-4 max-w-md mx-auto">
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
        <p className="text-xs text-muted-foreground">
          Defina uma meta para acompanhar seu progresso no dashboard
        </p>
      </div>
    </div>
  );
}

interface PieceStepProps {
  data: { nome: string; codigo: string; precoVenda: string; estoque: string };
  onChange: (data: { nome: string; codigo: string; precoVenda: string; estoque: string }) => void;
}

function PieceStep({ data, onChange }: PieceStepProps) {
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Cadastre uma peça de exemplo para ver como funciona. Você pode adicionar mais depois.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="piece-name">Nome da Peça</Label>
          <Input
            id="piece-name"
            placeholder="Ex: Brinco Gota Dourado"
            value={data.nome}
            onChange={(e) => onChange({ ...data, nome: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="piece-code">Código</Label>
          <Input
            id="piece-code"
            placeholder="Ex: BR001"
            value={data.codigo}
            onChange={(e) => onChange({ ...data, codigo: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="piece-stock">Estoque</Label>
          <Input
            id="piece-stock"
            type="number"
            placeholder="Ex: 10"
            value={data.estoque}
            onChange={(e) => onChange({ ...data, estoque: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="piece-price">Preço de Venda (R$)</Label>
          <Input
            id="piece-price"
            type="number"
            step="0.01"
            placeholder="Ex: 89.90"
            value={data.precoVenda}
            onChange={(e) => onChange({ ...data, precoVenda: e.target.value })}
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}

interface SellerStepProps {
  data: { nome: string; telefone: string; email: string };
  onChange: (data: { nome: string; telefone: string; email: string }) => void;
}

function SellerStep({ data, onChange }: SellerStepProps) {
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Adicione sua primeira revendedora. Você pode adicionar mais na página de Revendedoras.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seller-name">Nome da Revendedora</Label>
          <Input
            id="seller-name"
            placeholder="Ex: Ana Silva"
            value={data.nome}
            onChange={(e) => onChange({ ...data, nome: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seller-phone">WhatsApp</Label>
          <Input
            id="seller-phone"
            placeholder="(00) 00000-0000"
            value={data.telefone}
            onChange={(e) => onChange({ ...data, telefone: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seller-email">E-mail</Label>
          <Input
            id="seller-email"
            type="email"
            placeholder="ana@email.com"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            className="h-11"
          />
        </div>
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
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-primary" />
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Configuração Concluída!</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Seu sistema está pronto. Explore as funcionalidades e comece a gerenciar seu negócio.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <Button 
          variant="outline" 
          onClick={() => onGoTo('/pecas')}
          className="h-12 gap-2"
        >
          <Package className="w-4 h-4" />
          Ver Peças
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onGoTo('/revendedoras')}
          className="h-12 gap-2"
        >
          <Users className="w-4 h-4" />
          Revendedoras
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onGoTo('/pdv')}
          className="h-12 gap-2 col-span-2"
        >
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
        // Verificar no banco de dados primeiro
        const { data, error } = await supabase
          .from('user_preferences')
          .select('valor')
          .eq('user_id', user.id)
          .eq('chave', PREFERENCE_KEYS.ONBOARDING_COMPLETED)
          .single();

        if (error && error.code !== 'PGRST116') {
          // Se erro diferente de "não encontrado", verificar localStorage como fallback
          const localCompleted = localStorage.getItem('setup_wizard_completed');
          setShowWizard(!localCompleted);
        } else {
          setShowWizard(!data?.valor);
        }
      } catch {
        // Fallback para localStorage
        const localCompleted = localStorage.getItem('setup_wizard_completed');
        setShowWizard(!localCompleted);
      } finally {
        setIsLoading(false);
      }
    };

    // Delay para não aparecer imediatamente após login
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
