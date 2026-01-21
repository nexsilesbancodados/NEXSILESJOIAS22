import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Percent, DollarSign, AlertCircle } from 'lucide-react';

interface DescontoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCarrinho: number;
  onAplicarDesconto: (desconto: number, tipo: 'percentual' | 'valor') => void;
  senhaGerente?: string;
}

export function DescontoModal({
  open,
  onOpenChange,
  totalCarrinho,
  onAplicarDesconto,
  senhaGerente = '1234',
}: DescontoModalProps) {
  const [tipoDesconto, setTipoDesconto] = useState<'percentual' | 'valor'>('percentual');
  const [valorDesconto, setValorDesconto] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [limiteExcedido, setLimiteExcedido] = useState(false);

  const limitePercentual = 15; // Limite de desconto sem senha
  const limiteMaximo = 50; // Limite máximo de desconto

  const calcularDesconto = () => {
    const valor = parseFloat(valorDesconto) || 0;
    if (tipoDesconto === 'percentual') {
      return (totalCarrinho * valor) / 100;
    }
    return valor;
  };

  const calcularPercentual = () => {
    const desconto = calcularDesconto();
    return (desconto / totalCarrinho) * 100;
  };

  const handleValorChange = (value: string) => {
    setValorDesconto(value);
    setError('');
    
    const percentual = tipoDesconto === 'percentual' 
      ? parseFloat(value) || 0 
      : ((parseFloat(value) || 0) / totalCarrinho) * 100;
    
    setLimiteExcedido(percentual > limitePercentual);
  };

  const handleAplicar = () => {
    const percentual = calcularPercentual();
    
    if (percentual > limiteMaximo) {
      setError(`Desconto máximo permitido: ${limiteMaximo}%`);
      return;
    }

    if (limiteExcedido && senha !== senhaGerente) {
      setError('Senha de gerente inválida');
      return;
    }

    onAplicarDesconto(parseFloat(valorDesconto), tipoDesconto);
    onOpenChange(false);
    setValorDesconto('');
    setSenha('');
    setError('');
    setLimiteExcedido(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const presets = [5, 10, 15, 20];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Aplicar Desconto</DialogTitle>
          <DialogDescription>
            Total atual: {formatCurrency(totalCarrinho)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup
            value={tipoDesconto}
            onValueChange={(v) => {
              setTipoDesconto(v as 'percentual' | 'valor');
              setValorDesconto('');
              setLimiteExcedido(false);
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentual" id="percentual" />
              <Label htmlFor="percentual" className="flex items-center gap-1">
                <Percent className="w-4 h-4" /> Percentual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="valor" id="valor" />
              <Label htmlFor="valor" className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Valor Fixo
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label>Valor do Desconto</Label>
            <div className="relative">
              {tipoDesconto === 'percentual' && (
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              {tipoDesconto === 'valor' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
              )}
              <Input
                type="number"
                step="0.01"
                value={valorDesconto}
                onChange={(e) => handleValorChange(e.target.value)}
                className="pl-10"
                placeholder={tipoDesconto === 'percentual' ? '10' : '50.00'}
              />
            </div>
          </div>

          {/* Quick presets for percentage */}
          {tipoDesconto === 'percentual' && (
            <div className="flex gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => handleValorChange(String(preset))}
                  className="flex-1"
                >
                  {preset}%
                </Button>
              ))}
            </div>
          )}

          {/* Manager password field */}
          {limiteExcedido && (
            <div className="space-y-2 p-3 bg-warning/10 rounded-lg border border-warning/30">
              <div className="flex items-center gap-2 text-warning text-sm">
                <AlertCircle className="w-4 h-4" />
                Desconto acima de {limitePercentual}% requer senha de gerente
              </div>
              <Input
                type="password"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setError('');
                }}
                placeholder="Senha de gerente"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Preview */}
          {valorDesconto && parseFloat(valorDesconto) > 0 && (
            <div className="border rounded-lg p-4 space-y-2 bg-secondary/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totalCarrinho)}</span>
              </div>
              <div className="flex justify-between text-sm text-destructive">
                <span>Desconto ({calcularPercentual().toFixed(1)}%)</span>
                <span>-{formatCurrency(calcularDesconto())}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Novo Total</span>
                <span className="text-success">
                  {formatCurrency(Math.max(0, totalCarrinho - calcularDesconto()))}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAplicar}
            className="btn-gold"
            disabled={!valorDesconto || parseFloat(valorDesconto) <= 0}
          >
            Aplicar Desconto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
