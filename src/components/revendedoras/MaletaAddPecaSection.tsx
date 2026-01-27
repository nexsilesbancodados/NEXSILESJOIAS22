import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  Minus,
  Loader2,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Peca, MaletaItem, CatalogoItem } from '@/hooks/useSupabaseData';

interface MaletaAddPecaSectionProps {
  pecasDisponiveis: Peca[];
  maletaItems: (MaletaItem & { peca?: Peca })[];
  catalogos: { id: string; nome: string; ativo: boolean }[];
  catalogoItems: (CatalogoItem & { peca?: Peca })[];
  onAddPeca: (peca: Peca, quantidade: number) => Promise<void>;
  onAddFromCatalogo: (peca: Peca, quantidade: number) => Promise<void>;
  selectedCatalogoId: string;
  onCatalogoChange: (id: string) => void;
  searchPeca: string;
  onSearchChange: (value: string) => void;
  isAdding?: boolean;
}

export function MaletaAddPecaSection({
  pecasDisponiveis,
  maletaItems,
  catalogos,
  catalogoItems,
  onAddPeca,
  onAddFromCatalogo,
  selectedCatalogoId,
  onCatalogoChange,
  searchPeca,
  onSearchChange,
  isAdding,
}: MaletaAddPecaSectionProps) {
  const [addPecaSource, setAddPecaSource] = useState<'estoque' | 'catalogo'>('estoque');
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [addingPecaId, setAddingPecaId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular totais da maleta
  const totalPecas = maletaItems.length;
  const valorTotal = maletaItems.reduce((acc, item) => acc + (item.peca?.preco_venda || 0), 0);

  const getQuantidade = (pecaId: string) => quantidades[pecaId] || 1;

  const setQuantidade = (pecaId: string, value: number) => {
    setQuantidades(prev => ({
      ...prev,
      [pecaId]: Math.max(1, value)
    }));
  };

  const handleAddPeca = async (peca: Peca, source: 'estoque' | 'catalogo') => {
    const qtd = getQuantidade(peca.id);
    setAddingPecaId(peca.id);
    try {
      if (source === 'estoque') {
        await onAddPeca(peca, qtd);
      } else {
        await onAddFromCatalogo(peca, qtd);
      }
      // Reset quantity after adding
      setQuantidades(prev => {
        const next = { ...prev };
        delete next[peca.id];
        return next;
      });
    } finally {
      setAddingPecaId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumo da Maleta */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Peças na Maleta</p>
                  <p className="text-2xl font-bold">{totalPecas}</p>
                </div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(valorTotal)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Label className="text-base font-semibold">Adicionar Peça</Label>
      
      {/* Source Toggle */}
      <div className="flex gap-2">
        <Button
          variant={addPecaSource === 'estoque' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAddPecaSource('estoque')}
        >
          <Package className="w-4 h-4 mr-1" />
          Do Estoque
        </Button>
        <Button
          variant={addPecaSource === 'catalogo' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAddPecaSource('catalogo')}
        >
          <ShoppingCart className="w-4 h-4 mr-1" />
          Do Catálogo
        </Button>
      </div>

      {addPecaSource === 'estoque' ? (
        <div className="space-y-3">
          <Input
            placeholder="Buscar por nome ou código..."
            value={searchPeca}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          
          {/* Estoque List */}
          <ScrollArea className="h-[280px] border rounded-lg">
            <div className="p-2 space-y-2">
              {pecasDisponiveis.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  {searchPeca 
                    ? 'Nenhuma peça encontrada para esta busca' 
                    : 'Nenhuma peça disponível no estoque'}
                </p>
              ) : (
                pecasDisponiveis.map((peca) => {
                  const jaAdicionada = maletaItems.some(mi => mi.peca_id === peca.id);
                  const qtd = getQuantidade(peca.id);
                  const isAddingThis = addingPecaId === peca.id;
                  const maxQtd = peca.estoque;

                  return (
                    <div
                      key={peca.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors border",
                        jaAdicionada 
                          ? "bg-muted/50 opacity-60 border-transparent" 
                          : "border-border/50 hover:border-primary/30"
                      )}
                    >
                      <img
                        src={peca.imagem_url || '/placeholder.svg'}
                        alt={peca.nome}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{peca.nome}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{peca.codigo}</span>
                          {peca.categoria && (
                            <>
                              <span>•</span>
                              <span>{peca.categoria}</span>
                            </>
                          )}
                        </div>
                        <p className="font-semibold text-primary mt-1">{formatCurrency(peca.preco_venda)}</p>
                      </div>
                      
                      {jaAdicionada ? (
                        <Badge variant="secondary" className="shrink-0">Na maleta</Badge>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setQuantidade(peca.id, qtd - 1)}
                              disabled={qtd <= 1 || isAddingThis}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{qtd}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setQuantidade(peca.id, qtd + 1)}
                              disabled={qtd >= maxQtd || isAddingThis}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <Button
                            size="sm"
                            className="btn-gold"
                            onClick={() => handleAddPeca(peca, 'estoque')}
                            disabled={isAddingThis || isAdding}
                          >
                            {isAddingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <p className="text-xs text-muted-foreground text-center">
            {pecasDisponiveis.length} peça(s) disponível(is) no estoque
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Catalog Selector */}
          <select
            className="w-full p-2 border rounded-lg bg-background"
            value={selectedCatalogoId}
            onChange={(e) => onCatalogoChange(e.target.value)}
          >
            <option value="">Selecione um catálogo...</option>
            {catalogos.filter(c => c.ativo).map((catalogo) => (
              <option key={catalogo.id} value={catalogo.id}>
                {catalogo.nome}
              </option>
            ))}
          </select>

          {/* Catalog Items */}
          {selectedCatalogoId && (
            <ScrollArea className="h-[230px] border rounded-lg">
              <div className="p-2 space-y-2">
                {catalogoItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    Nenhuma peça neste catálogo
                  </p>
                ) : (
                  catalogoItems.map((item) => {
                    const jaAdicionada = maletaItems.some(mi => mi.peca_id === item.peca_id);
                    const qtd = getQuantidade(item.peca?.id || '');
                    const isAddingThis = addingPecaId === item.peca?.id;
                    const maxQtd = item.quantidade || 1;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors border",
                          jaAdicionada 
                            ? "bg-muted/50 opacity-60 border-transparent" 
                            : "border-border/50 hover:border-primary/30"
                        )}
                      >
                        <img
                          src={item.peca?.imagem_url || '/placeholder.svg'}
                          alt={item.peca?.nome}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.peca?.nome}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.peca?.codigo}</p>
                          <p className="font-semibold text-primary mt-1">{formatCurrency(item.peca?.preco_venda || 0)}</p>
                        </div>
                        
                        {jaAdicionada ? (
                          <Badge variant="secondary" className="shrink-0">Na maleta</Badge>
                        ) : item.peca && (
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setQuantidade(item.peca!.id, qtd - 1)}
                                disabled={qtd <= 1 || isAddingThis}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">{qtd}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setQuantidade(item.peca!.id, qtd + 1)}
                                disabled={qtd >= maxQtd || isAddingThis}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              className="btn-gold"
                              onClick={() => handleAddPeca(item.peca!, 'catalogo')}
                              disabled={isAddingThis || isAdding}
                            >
                              {isAddingThis ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Lista de peças já na maleta */}
      {maletaItems.length > 0 && (
        <div className="pt-3 border-t">
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Peças na Maleta ({totalPecas})
          </Label>
          <ScrollArea className="h-[120px]">
            <div className="flex flex-wrap gap-2">
              {maletaItems.map((item) => (
                <Badge 
                  key={item.id} 
                  variant="outline" 
                  className={cn(
                    "py-1 px-2",
                    item.status === 'vendido' && "bg-success/10 border-success/30",
                    item.status === 'devolvido' && "bg-muted"
                  )}
                >
                  <img
                    src={item.peca?.imagem_url || '/placeholder.svg'}
                    alt={item.peca?.nome}
                    className="w-5 h-5 rounded mr-2 object-cover"
                  />
                  <span className="truncate max-w-[100px]">{item.peca?.nome}</span>
                  <span className="ml-2 text-muted-foreground">{formatCurrency(item.peca?.preco_venda || 0)}</span>
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
