import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Package, Tag, AlertCircle, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Peca } from '@/hooks/useSupabaseData';

interface ConsultaPrecoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pecas: Peca[];
  onAddToCarrinho: (peca: Peca) => void;
}

export function ConsultaPrecoModal({
  open,
  onOpenChange,
  pecas,
  onAddToCarrinho,
}: ConsultaPrecoModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pecaSelecionada, setPecaSelecionada] = useState<Peca | null>(null);

  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setPecaSelecionada(null);
    }
  }, [open]);

  const filteredPecas = pecas.filter(peca =>
    peca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    peca.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleAddToCarrinho = () => {
    if (pecaSelecionada && pecaSelecionada.estoque > 0) {
      onAddToCarrinho(pecaSelecionada);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Consulta de Preço
          </DialogTitle>
          <DialogDescription>
            Busque um produto por nome ou código
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPecaSelecionada(null);
              }}
              placeholder="Digite o código ou nome do produto..."
              className="pl-10 text-lg"
              autoFocus
            />
          </div>

          {/* Search results */}
          {searchTerm && !pecaSelecionada && (
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {filteredPecas.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Produto não encontrado</p>
                </div>
              ) : (
                filteredPecas.slice(0, 5).map((peca) => (
                  <div
                    key={peca.id}
                    onClick={() => setPecaSelecionada(peca)}
                    className="p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:bg-secondary/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{peca.nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">{peca.codigo}</p>
                      </div>
                      <p className="font-semibold text-lg text-primary">
                        {formatCurrency(peca.preco_venda)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Selected product details */}
          {pecaSelecionada && (
            <div className="border rounded-lg overflow-hidden animate-scale-in">
              <div className="flex">
                <img
                  src={pecaSelecionada.imagem_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                  alt={pecaSelecionada.nome}
                  className="w-32 h-32 object-cover"
                />
                <div className="flex-1 p-4">
                  <h3 className="font-semibold text-lg">{pecaSelecionada.nome}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{pecaSelecionada.codigo}</p>
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={pecaSelecionada.estoque > 0 ? "default" : "destructive"}>
                        {pecaSelecionada.estoque > 0 ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Em estoque: {pecaSelecionada.estoque}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Sem estoque
                          </>
                        )}
                      </Badge>
                    </div>
                    {pecaSelecionada.material && (
                      <p className="text-xs text-muted-foreground">
                        Material: {pecaSelecionada.material}
                      </p>
                    )}
                    {pecaSelecionada.categoria && (
                      <p className="text-xs text-muted-foreground">
                        Categoria: {pecaSelecionada.categoria}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t p-4 bg-secondary/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Preço de Venda</p>
                    <p className="text-3xl font-display font-semibold text-primary">
                      {formatCurrency(pecaSelecionada.preco_venda)}
                    </p>
                  </div>
                  <Button
                    onClick={handleAddToCarrinho}
                    disabled={pecaSelecionada.estoque <= 0}
                    className="btn-gold"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                </div>
                
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
