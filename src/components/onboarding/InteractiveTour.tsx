import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Check,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector para o elemento alvo
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'none';
  route?: string; // Rota onde este step deve aparecer
}

interface InteractiveTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip?: () => void;
  storageKey?: string;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

export function InteractiveTour({ 
  steps, 
  onComplete, 
  onSkip,
  storageKey = 'interactive_tour_completed'
}: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0, arrowPosition: 'top' });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Encontrar e destacar o elemento alvo
  const updateTargetPosition = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2, arrowPosition: 'top' });
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Calcular posição do tooltip
      const padding = 16;
      const tooltipWidth = 320;
      const tooltipHeight = 180;
      
      let top = 0;
      let left = 0;
      let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

      const placement = step.placement || 'bottom';

      switch (placement) {
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = 'top';
          break;
        case 'top':
          top = rect.top - tooltipHeight - padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = 'bottom';
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - padding;
          arrowPosition = 'right';
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + padding;
          arrowPosition = 'left';
          break;
        case 'center':
          top = window.innerHeight / 2 - tooltipHeight / 2;
          left = window.innerWidth / 2 - tooltipWidth / 2;
          arrowPosition = 'top';
          break;
      }

      // Garantir que o tooltip fique dentro da tela
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

      setTooltipPosition({ top, left, arrowPosition });

      // Scroll suave até o elemento se necessário
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
      setTooltipPosition({ top: window.innerHeight / 2 - 90, left: window.innerWidth / 2 - 160, arrowPosition: 'top' });
    }
  }, [step]);

  useEffect(() => {
    updateTargetPosition();
    
    // Atualizar posição em resize e scroll
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);
    
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [updateTargetPosition, currentStep]);

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
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
    onSkip?.();
    setTimeout(onComplete, 300);
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
    setTimeout(onComplete, 300);
  };

  if (!isVisible || !step) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
      >
        {/* Overlay escuro com recorte - clicável para fechar */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer"
          onClick={handleSkip}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Borda destacada ao redor do elemento */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          >
            <div className="w-full h-full rounded-lg border-2 border-primary shadow-[0_0_0_4px_rgba(var(--primary)/0.3)] animate-pulse" />
          </motion.div>
        )}

        {/* Tooltip com conteúdo do passo */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-10 pointer-events-auto"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: 320,
          }}
        >
          <Card className="shadow-2xl border-primary/30 bg-background/95 backdrop-blur-sm">
            <div className="p-4">
              {/* Header com progresso */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        index === currentStep
                          ? 'w-4 bg-primary'
                          : index < currentStep
                          ? 'w-1.5 bg-primary/60'
                          : 'w-1.5 bg-muted'
                      )}
                    />
                  ))}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {currentStep + 1}/{steps.length}
                </Badge>
              </div>

              {/* Conteúdo */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevious}
                      className="h-8"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Voltar
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSkip}
                    className="h-8 text-muted-foreground"
                  >
                    Pular
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleNext}
                    className="h-8 btn-gold"
                  >
                    {isLastStep ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Concluir
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
            </div>

            {/* Seta do tooltip */}
            <div
              className={cn(
                "absolute w-3 h-3 bg-background border rotate-45",
                tooltipPosition.arrowPosition === 'top' && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t",
                tooltipPosition.arrowPosition === 'bottom' && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b",
                tooltipPosition.arrowPosition === 'left' && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-b",
                tooltipPosition.arrowPosition === 'right' && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-r border-t"
              )}
            />
          </Card>
        </motion.div>

        {/* Overlay click handled by SVG above */}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// Hook para usar o tour
export function useInteractiveTour(storageKey: string = 'interactive_tour_completed') {
  const [showTour, setShowTour] = useState(false);

  // Tour no longer auto-starts - must be explicitly triggered via startTour()
  // This prevents the overlay from blocking all UI interactions

  const startTour = useCallback(() => {
    setShowTour(true);
  }, []);

  const endTour = useCallback(() => {
    setShowTour(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setShowTour(true);
  }, [storageKey]);

  return {
    showTour,
    startTour,
    endTour,
    resetTour,
  };
}
