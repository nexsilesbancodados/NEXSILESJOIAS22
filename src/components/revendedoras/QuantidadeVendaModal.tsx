import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';

interface QuantidadeVendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    peca_id: string;
    quantidade: number;
    peca?: {
      nome?: string;
      codigo?: string;
      preco_venda?: number;
      imagem_url?: string;
    };
  } | null;
  onConfirm: (itemId: string, pecaId: string, quantidadeVendida: number, quantidadeTotal: number) => void;
  isPending?: boolean;
}

export function QuantidadeVendaModal({
  open,
  onOpenChange,
  item,
  onConfirm,
  isPending = false,
}: QuantidadeVendaModalProps) {
  const [quantidade, setQuantidade] = useState(1);

  const maxQuantidade = item?.quantidade || 1;

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setQuantidade(1);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (item && quantidade > 0 && quantidade <= maxQuantidade) {
      onConfirm(item.id, item.peca_id, quantidade, item.quantidade);
    }
  };

  const incrementar = () => {
    if (quantidade < maxQuantidade) {
      setQuantidade(prev => prev + 1);
    }
  };

  const decrementar = () => {
    if (quantidade > 1) {
      setQuantidade(prev => prev - 1);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const precoTotal = (item?.peca?.preco_venda || 0) * quantidade;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Venda</DialogTitle>
          <DialogDescription>
            Selecione a quantidade de peças vendidas
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="space-y-4">
            {/* Item info */}
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <img
                src={item.peca?.imagem_url || '/placeholder.svg'}
                alt={item.peca?.nome}
                className="w-14 h-14 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.peca?.nome || 'Peça'}</p>
                <p className="text-sm text-muted-foreground">{item.peca?.codigo}</p>
                <p className="text-sm font-medium text-primary">
                  {formatCurrency(item.peca?.preco_venda || 0)} / un
                </p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="space-y-2">
              <Label>Quantidade vendida (máx: {maxQuantidade})</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={decrementar}
                  disabled={quantidade <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={maxQuantidade}
                  value={quantidade}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantidade(Math.min(Math.max(1, val), maxQuantidade));
                  }}
                  className="w-20 text-center text-lg font-semibold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={incrementar}
                  disabled={quantidade >= maxQuantidade}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
              <span className="text-sm font-medium">Total da venda:</span>
              <span className="text-lg font-bold text-success">
                {formatCurrency(precoTotal)}
              </span>
            </div>

            {/* Info about remaining */}
            {quantidade < maxQuantidade && (
              <p className="text-sm text-muted-foreground text-center">
                {maxQuantidade - quantidade} unidade(s) permanecerão pendentes na maleta
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !item || quantidade < 1}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {isPending ? 'Registrando...' : 'Confirmar Venda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
