import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertValue?: (value: number) => void;
}

export function CalculatorModal({ open, onOpenChange, onInsertValue }: CalculatorModalProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const calculate = useCallback(() => {
    if (previousValue === null || operation === null) return parseFloat(display);
    
    const current = parseFloat(display);
    let result: number;

    switch (operation) {
      case '+':
        result = previousValue + current;
        break;
      case '-':
        result = previousValue - current;
        break;
      case '*':
        result = previousValue * current;
        break;
      case '/':
        result = previousValue / current;
        break;
      default:
        return current;
    }

    return result;
  }, [previousValue, operation, display]);

  const handleDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  }, [display, waitingForOperand]);

  const handleDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const handleOperator = useCallback((op: string) => {
    const current = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(current);
    } else if (operation) {
      const result = calculate();
      setPreviousValue(result);
      setDisplay(String(result));
    }

    setWaitingForOperand(true);
    setOperation(op);
  }, [display, previousValue, operation, calculate]);

  const handleEquals = useCallback(() => {
    if (operation === null || previousValue === null) return;

    const result = calculate();
    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  }, [operation, previousValue, calculate]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);

  const handlePercentage = useCallback(() => {
    const current = parseFloat(display);
    setDisplay(String(current / 100));
  }, [display]);

  const handlePlusMinus = useCallback(() => {
    const current = parseFloat(display);
    setDisplay(String(-current));
  }, [display]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;

    if (e.key >= '0' && e.key <= '9') {
      handleDigit(e.key);
    } else if (e.key === '.') {
      handleDecimal();
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      handleOperator(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleEquals();
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
      handleClear();
    } else if (e.key === '%') {
      handlePercentage();
    }
  }, [open, handleDigit, handleDecimal, handleOperator, handleEquals, handleClear, handlePercentage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const buttonClass = "h-14 text-lg font-medium transition-all hover:scale-105 active:scale-95";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-display">Calculadora</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Display */}
          <div className="bg-secondary rounded-lg p-4">
            <div className="text-right">
              {previousValue !== null && operation && (
                <div className="text-sm text-muted-foreground">
                  {previousValue} {operation}
                </div>
              )}
              <div className="text-3xl font-mono font-semibold truncate">
                {parseFloat(display).toLocaleString('pt-BR', { maximumFractionDigits: 8 })}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="secondary"
              className={buttonClass}
              onClick={handleClear}
            >
              C
            </Button>
            <Button
              variant="secondary"
              className={buttonClass}
              onClick={handlePlusMinus}
            >
              ±
            </Button>
            <Button
              variant="secondary"
              className={buttonClass}
              onClick={handlePercentage}
            >
              %
            </Button>
            <Button
              variant="outline"
              className={cn(buttonClass, "text-primary")}
              onClick={() => handleOperator('/')}
            >
              ÷
            </Button>

            <Button variant="ghost" className={buttonClass} onClick={() => handleDigit('7')}>7</Button>
            <Button variant="ghost" className={buttonClass} onClick={() => handleDigit('8')}>8</Button>
            <Button variant="ghost" className={buttonClass} onClick={() => handleDigit('9')}>9</Button>
            <Button
              variant="outline"
              className={cn(buttonClass, "text-primary")}
              onClick={() => handleOperator('*')}
            >
              ×
            </Button>

            <Button variant="ghost" className={buttonClass} onClick={() => handleDigit('4')}>4</Button>
            <Button variant="ghost" className={buttonClass} onClick={() => handleDigit('5')}>5</Button>
            <Button variant="ghost" className={buttonClass} onClick={() => handleDigit('6')}>6</Button>
            <Button
              variant="outline"
              className={cn(buttonClass, "text-primary")}
              onClick={() => handleOperator('-')}
            >
              −
            </Button>

            <Button variant="ghost" className={buttonClass} onClick={() => handleDigit('1')}>1</Button>
            <Button variant="ghost" className={buttonClass} onClick={() => handleDigit('2')}>2</Button>
            <Button variant="ghost" className={buttonClass} onClick={() => handleDigit('3')}>3</Button>
            <Button
              variant="outline"
              className={cn(buttonClass, "text-primary")}
              onClick={() => handleOperator('+')}
            >
              +
            </Button>

            <Button variant="ghost" className={cn(buttonClass, "col-span-2")} onClick={() => handleDigit('0')}>
              0
            </Button>
            <Button variant="ghost" className={buttonClass} onClick={handleDecimal}>,</Button>
            <Button
              className={cn(buttonClass, "btn-gold")}
              onClick={handleEquals}
            >
              =
            </Button>
          </div>

          {/* Insert value button */}
          {onInsertValue && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                onInsertValue(parseFloat(display));
                onOpenChange(false);
              }}
            >
              Inserir Valor no Pagamento
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
