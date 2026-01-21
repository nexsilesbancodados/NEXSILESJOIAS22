import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, ArrowLeft, Package, Search, AlertCircle } from 'lucide-react';
import { type Peca } from '@/hooks/useSupabaseData';

interface TrocaDevolucaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pecas: Peca[];
  onConfirmarTroca: (data: {
    tipo: 'troca' | 'devolucao';
    pecaOriginal: Peca;
    pecaNova?: Peca;
    motivo: string;
    valorDiferenca?: number;
  }) => void;
}

export function TrocaDevolucaoModal({
  open,
  onOpenChange,
  pecas,
  onConfirmarTroca,
}: TrocaDevolucaoModalProps) {
  const [tipo, setTipo] = useState<'troca' | 'devolucao'>('troca');
  const [codigoOriginal, setCodigoOriginal] = useState('');
  const [pecaOriginal, setPecaOriginal] = useState<Peca | null>(null);
  const [codigoNovo, setCodigoNovo] = useState('');
  const [pecaNova, setPecaNova] = useState<Peca | null>(null);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const handleBuscarOriginal = () => {
    const peca = pecas.find(p => 
      p.codigo.toLowerCase() === codigoOriginal.toLowerCase()
    );
    if (peca) {
      setPecaOriginal(peca);
      setError('');
    } else {
      setError('Produto não encontrado');
    }
  };

  const handleBuscarNovo = () => {
    const peca = pecas.find(p => 
      p.codigo.toLowerCase() === codigoNovo.toLowerCase()
    );
    if (peca) {
      setPecaNova(peca);
      setError('');
    } else {
      setError('Produto não encontrado');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calcularDiferenca = () => {
    if (!pecaOriginal || !pecaNova) return 0;
    return pecaNova.preco_venda - pecaOriginal.preco_venda;
  };

  const handleConfirmar = () => {
    if (!pecaOriginal) {
      setError('Selecione o produto original');
      return;
    }
    if (tipo === 'troca' && !pecaNova) {
      setError('Selecione o novo produto');
      return;
    }
    if (!motivo.trim()) {
      setError('Informe o motivo');
      return;
    }

    onConfirmarTroca({
      tipo,
      pecaOriginal,
      pecaNova: pecaNova || undefined,
      motivo,
      valorDiferenca: tipo === 'troca' ? calcularDiferenca() : undefined,
    });

    // Reset form
    setTipo('troca');
    setCodigoOriginal('');
    setPecaOriginal(null);
    setCodigoNovo('');
    setPecaNova(null);
    setMotivo('');
    setError('');
    onOpenChange(false);
  };

  const motivosComuns = [
    'Defeito de fabricação',
    'Tamanho incorreto',
    'Não gostou do produto',
    'Produto diferente do pedido',
    'Desistência',
    'Outro',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Troca / Devolução
          </DialogTitle>
          <DialogDescription>
            Registre uma troca ou devolução de produto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type selection */}
          <RadioGroup
            value={tipo}
            onValueChange={(v) => {
              setTipo(v as 'troca' | 'devolucao');
              setPecaNova(null);
              setCodigoNovo('');
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="troca" id="troca" />
              <Label htmlFor="troca" className="flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Troca
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="devolucao" id="devolucao" />
              <Label htmlFor="devolucao" className="flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Devolução
              </Label>
            </div>
          </RadioGroup>

          {/* Original product */}
          <div className="space-y-2">
            <Label>Produto Original</Label>
            <div className="flex gap-2">
              <Input
                value={codigoOriginal}
                onChange={(e) => setCodigoOriginal(e.target.value)}
                placeholder="Código do produto"
                onKeyDown={(e) => e.key === 'Enter' && handleBuscarOriginal()}
              />
              <Button variant="outline" onClick={handleBuscarOriginal}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {pecaOriginal && (
              <div className="p-3 bg-secondary/50 rounded-lg flex items-center gap-3 animate-scale-in">
                <img
                  src={pecaOriginal.imagem_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=60&h=60&fit=crop'}
                  alt={pecaOriginal.nome}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">{pecaOriginal.nome}</p>
                  <p className="text-sm text-muted-foreground font-mono">{pecaOriginal.codigo}</p>
                </div>
                <p className="font-semibold">{formatCurrency(pecaOriginal.preco_venda)}</p>
              </div>
            )}
          </div>

          {/* New product (for exchange) */}
          {tipo === 'troca' && (
            <div className="space-y-2">
              <Label>Novo Produto</Label>
              <div className="flex gap-2">
                <Input
                  value={codigoNovo}
                  onChange={(e) => setCodigoNovo(e.target.value)}
                  placeholder="Código do novo produto"
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarNovo()}
                />
                <Button variant="outline" onClick={handleBuscarNovo}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              
              {pecaNova && (
                <div className="p-3 bg-secondary/50 rounded-lg flex items-center gap-3 animate-scale-in">
                  <img
                    src={pecaNova.imagem_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=60&h=60&fit=crop'}
                    alt={pecaNova.nome}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{pecaNova.nome}</p>
                    <p className="text-sm text-muted-foreground font-mono">{pecaNova.codigo}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(pecaNova.preco_venda)}</p>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivosComuns.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {motivo === 'Outro' && (
              <Textarea
                placeholder="Descreva o motivo..."
                className="mt-2"
              />
            )}
          </div>

          {/* Price difference */}
          {tipo === 'troca' && pecaOriginal && pecaNova && (
            <div className="border rounded-lg p-4 space-y-2 bg-secondary/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Produto original</span>
                <span>{formatCurrency(pecaOriginal.preco_venda)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Novo produto</span>
                <span>{formatCurrency(pecaNova.preco_venda)}</span>
              </div>
              <div className={`flex justify-between font-semibold text-lg border-t pt-2 ${
                calcularDiferenca() > 0 ? 'text-destructive' : calcularDiferenca() < 0 ? 'text-success' : ''
              }`}>
                <span>Diferença</span>
                <span>
                  {calcularDiferenca() > 0 && '+'}
                  {formatCurrency(calcularDiferenca())}
                </span>
              </div>
              {calcularDiferenca() > 0 && (
                <p className="text-xs text-muted-foreground">
                  Cliente deve pagar a diferença
                </p>
              )}
              {calcularDiferenca() < 0 && (
                <p className="text-xs text-muted-foreground">
                  Cliente recebe crédito/troco
                </p>
              )}
            </div>
          )}

          {/* Refund info for return */}
          {tipo === 'devolucao' && pecaOriginal && (
            <div className="border rounded-lg p-4 bg-warning/10 border-warning/30">
              <div className="flex items-center gap-2 text-warning mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Valor a devolver</span>
              </div>
              <p className="text-2xl font-display font-semibold">
                {formatCurrency(pecaOriginal.preco_venda)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O produto retornará ao estoque
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            className="btn-gold"
            disabled={!pecaOriginal || (tipo === 'troca' && !pecaNova) || !motivo}
          >
            Confirmar {tipo === 'troca' ? 'Troca' : 'Devolução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
