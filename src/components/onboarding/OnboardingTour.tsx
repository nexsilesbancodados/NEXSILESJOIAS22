import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  FileBarChart,
  Settings,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  target?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Sistema!',
    description: 'Vamos fazer um tour rápido pelas principais funcionalidades. Você pode pular a qualquer momento.',
    icon: Sparkles,
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Aqui você tem uma visão geral do seu negócio: vendas, metas, peças e muito mais.',
    icon: LayoutDashboard,
    target: '/dashboard',
  },
  {
    id: 'pecas',
    title: 'Gestão de Peças',
    description: 'Cadastre, edite e controle o estoque das suas peças. Adicione fotos, preços e categorias.',
    icon: Package,
    target: '/pecas',
  },
  {
    id: 'revendedoras',
    title: 'Revendedoras',
    description: 'Gerencie suas revendedoras, acompanhe comissões e controle maletas.',
    icon: Users,
    target: '/revendedoras',
  },
  {
    id: 'pdv',
    title: 'Ponto de Venda',
    description: 'Registre vendas rapidamente com nosso PDV otimizado. Use atalhos de teclado para agilizar.',
    icon: ShoppingBag,
    target: '/pdv',
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    description: 'Analise seus resultados com gráficos e exporte para PDF ou Excel.',
    icon: FileBarChart,
    target: '/relatorios',
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    description: 'Personalize o sistema, configure metas e gerencie sua conta.',
    icon: Settings,
    target: '/configuracoes',
  },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
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

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding_completed', 'true');
    setTimeout(onComplete, 300);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <Card className="w-full max-w-lg shadow-2xl border-primary/20">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {TOUR_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        index === currentStep
                          ? 'w-6 bg-primary'
                          : index < currentStep
                          ? 'bg-primary/50'
                          : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <Button variant="ghost" size="icon" onClick={handleSkip}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-semibold mb-2">{step.title}</h2>
                <p className="text-muted-foreground">{step.description}</p>
                {step.target && (
                  <Badge variant="secondary" className="mt-3">
                    Página: {step.target}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className={cn(isFirstStep && 'invisible')}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <Button variant="link" onClick={handleSkip} className="text-muted-foreground">
                  Pular tour
                </Button>

                <Button onClick={handleNext}>
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Começar
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Progress */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {currentStep + 1} de {TOUR_STEPS.length}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed');
    if (!completed) {
      // Delay para não aparecer imediatamente
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetTour = () => {
    localStorage.removeItem('onboarding_completed');
    setShowTour(true);
  };

  return {
    showTour,
    setShowTour,
    resetTour,
  };
}
