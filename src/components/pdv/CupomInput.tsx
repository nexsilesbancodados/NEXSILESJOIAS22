import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Ticket, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useValidarCupom, type ValidacaoCupom } from '@/hooks/useCampanhas';

interface CupomInputProps {
  onCupomValidado: (cupom: ValidacaoCupom | null) => void;
  cupomAplicado: ValidacaoCupom | null;
  disabled?: boolean;
}

export function CupomInput({ onCupomValidado, cupomAplicado, disabled }: CupomInputProps) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const validarCupom = useValidarCupom();

  const handleValidar = async () => {
    if (!codigo.trim()) return;
    
    setErro(null);
    const resultado = await validarCupom.mutateAsync(codigo.trim());
    
    if (resultado.valido) {
      onCupomValidado(resultado);
      setCodigo('');
    } else {
      setErro(resultado.mensagem);
    }
  };

  const handleRemover = () => {
    onCupomValidado(null);
    setErro(null);
  };

  const formatDesconto = (cupom: ValidacaoCupom) => {
    if (cupom.tipo === 'percentual') {
      return `${cupom.valor}% OFF`;
    }
    if (cupom.tipo === 'valor_fixo') {
      return `R$ ${cupom.valor?.toFixed(2)} OFF`;
    }
    return 'Frete Grátis';
  };

  if (cupomAplicado) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <Check className="w-4 h-4 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-700">{cupomAplicado.nome}</p>
          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">
            {formatDesconto(cupomAplicado)}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-700 hover:text-destructive"
          onClick={handleRemover}
          disabled={disabled}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              setErro(null);
            }}
            placeholder="Código do cupom"
            className={cn('pl-10 font-mono', erro && 'border-destructive')}
            disabled={disabled || validarCupom.isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleValidar();
              }
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleValidar}
          disabled={disabled || validarCupom.isPending || !codigo.trim()}
        >
          {validarCupom.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Aplicar'
          )}
        </Button>
      </div>
      {erro && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          {erro}
        </div>
      )}
    </div>
  );
}
