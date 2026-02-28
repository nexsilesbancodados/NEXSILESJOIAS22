import { User, CreditCard, CheckCircle } from 'lucide-react';

type Step = 'dados' | 'metodo' | 'pagamento' | 'pix' | 'confirmacao';

interface CheckoutProgressProps {
  currentStep: Step;
  corPrimaria?: string;
}

const STEPS = [
  { key: 'dados', label: 'Dados', icon: User },
  { key: 'pagamento', label: 'Pagamento', icon: CreditCard },
  { key: 'confirmacao', label: 'Confirmação', icon: CheckCircle },
] as const;

function getStepIndex(step: Step): number {
  if (step === 'dados') return 0;
  if (step === 'metodo' || step === 'pagamento' || step === 'pix') return 1;
  return 2;
}

export function CheckoutProgress({ currentStep, corPrimaria = '#B76E79' }: CheckoutProgressProps) {
  const activeIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: isActive || isDone ? corPrimaria : '#e5e7eb',
                  color: isActive || isDone ? 'white' : '#9ca3af',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className="text-[10px] mt-1 font-medium"
                style={{ color: isActive ? corPrimaria : '#9ca3af' }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-12 h-0.5 mx-1 mt-[-12px]"
                style={{ backgroundColor: isDone ? corPrimaria : '#e5e7eb' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
