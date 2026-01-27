import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  Minus,
  Loader2,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Trash2
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
  onRemovePeca?: (itemId: string, pecaId: string) => Promise<void>;
  selectedCatalogoId: string;
  onCatalogoChange: (id: string) => void;
  searchPeca: string;
  onSearchChange: (value: string) => void;
  isAdding?: boolean;
  isRemoving?: boolean;
}

export function MaletaAddPecaSection({
  pecasDisponiveis,
  maletaItems,
  catalogos,
  catalogoItems,
  onAddPeca,
  onAddFromCatalogo,
  onRemovePeca,
  selectedCatalogoId,
  onCatalogoChange,
  searchPeca,
  onSearchChange,
  isAdding,
  isRemoving,
}: MaletaAddPecaSectionProps) {
  const [addPecaSource, setAddPecaSource] = useState<'estoque' | 'catalogo'>('estoque');
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [addingPecaId, setAddingPecaId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular totais da maleta
  const totalPecas = maletaItems.length;
  const valorTotal = maletaItems.reduce((acc, item) => acc + (item.peca?.preco_venda || 0), 0);
  
  // Separar por status
  const itemsVendidos = maletaItems.filter(item => item.status === 'vendido');
  const itemsPendentes = maletaItems.filter(item => item.status === 'pendente');
  const itemsDevolvidos = maletaItems.filter(item => item.status === 'devolvido');
  
  const valorVendido = itemsVendidos.reduce((acc, item) => acc + (item.peca?.preco_venda || 0), 0);
  const valorPendente = itemsPendentes.reduce((acc, item) => acc + (item.peca?.preco_venda || 0), 0);
  
  const percentualVendido = totalPecas > 0 ? (itemsVendidos.length / totalPecas) * 100 : 0;

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
      setQuantidades(prev => {
        const next = { ...prev };
        delete next[peca.id];
        return next;
      });
    } finally {
      setAddingPecaId(null);
    }
  };

  const handleRemovePeca = async (itemId: string, pecaId: string) => {
    if (!onRemovePeca) return;
    setRemovingItemId(itemId);
    try {
      await onRemovePeca(itemId, pecaId);
    } finally {
      setRemovingItemId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumo Completo da Maleta */}
      <Card className="border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Peças</p>
                <p className="text-xl font-bold">{totalPecas}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-xl font-bold">{formatCurrency(valorTotal)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendido</p>
                <p className="text-xl font-bold text-success">{formatCurrency(valorVendido)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(valorPendente)}</p>
              </div>
            </div>
          </div>
          
          {totalPecas > 0 && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Progresso de Vendas
                </span>
                <span className="font-medium">{Math.round(percentualVendido)}%</span>
              </div>
              <Progress value={percentualVendido} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{itemsVendidos.length} vendidas</span>
                <span>{itemsPendentes.length} pendentes</span>
                <span>{itemsDevolvidos.length} devolvidas</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de Peças na Maleta por Status com botão de remover */}
      {maletaItems.length > 0 && (
        <div className="space-y-3">
          {/* Peças Pendentes - com opção de remover */}
          {itemsPendentes.length > 0 && (
            <div className="p-3 rounded-lg border bg-warning/5 border-warning/20">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-warning" />
                <span className="font-semibold text-warning text-sm">
                  Pendentes ({itemsPendentes.length}) - {formatCurrency(valorPendente)}
                </span>
              </div>
              <ScrollArea className="max-h-[180px]">
                <div className="space-y-2">
                  {itemsPendentes.map((item) => {
                    const isRemovingThis = removingItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-warning/20"
                      >
                        <img
                          src={item.peca?.imagem_url || '/placeholder.svg'}
                          alt={item.peca?.nome}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.peca?.nome}</p>
                          <p className="text-xs text-muted-foreground">{item.peca?.codigo}</p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">
                          {formatCurrency(item.peca?.preco_venda || 0)}
                        </span>
                        {onRemovePeca && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemovePeca(item.id, item.peca_id || '')}
                            disabled={isRemovingThis || isRemoving}
                          >
                            {isRemovingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Peças Vendidas */}
          {itemsVendidos.length > 0 && (
            <div className="p-3 rounded-lg border bg-success/5 border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="font-semibold text-success text-sm">
                  Vendidas ({itemsVendidos.length}) - {formatCurrency(valorVendido)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {itemsVendidos.map((item) => (
                  <Badge key={item.id} variant="outline" className="bg-success/10 border-success/30 py-1 px-2">
                    <img
                      src={item.peca?.imagem_url || '/placeholder.svg'}
                      alt={item.peca?.nome}
                      className="w-5 h-5 rounded mr-2 object-cover"
                    />
                    <span className="truncate max-w-[80px] text-xs">{item.peca?.nome}</span>
                    <span className="ml-1 text-xs font-semibold">{formatCurrency(item.peca?.preco_venda || 0)}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Peças Devolvidas */}
          {itemsDevolvidos.length > 0 && (
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground text-sm">
                  Devolvidas ({itemsDevolvidos.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {itemsDevolvidos.map((item) => (
                  <Badge key={item.id} variant="secondary" className="py-1 px-2 opacity-70">
                    <img
                      src={item.peca?.imagem_url || '/placeholder.svg'}
                      alt={item.peca?.nome}
                      className="w-5 h-5 rounded mr-2 object-cover"
                    />
                    <span className="truncate max-w-[80px] text-xs">{item.peca?.nome}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botão e Seção de Adicionar Peças */}
      <Collapsible open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            className="w-full btn-gold gap-2" 
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Adicionar Peças
            <ChevronDown className={cn(
              "w-4 h-4 ml-auto transition-transform",
              isAddSectionOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-4">
          <div className="p-4 rounded-lg border bg-card space-y-4">
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
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-semibold text-primary">{formatCurrency(peca.preco_venda)}</span>
                                <Badge variant="outline" className="text-xs">Est: {peca.estoque}</Badge>
                              </div>
                            </div>
                            
                            {jaAdicionada ? (
                              <Badge variant="secondary" className="shrink-0">Na maleta</Badge>
                            ) : (
                              <div className="flex flex-col items-end gap-2 shrink-0">
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

                {selectedCatalogoId && (
                  <ScrollArea className="h-[240px] border rounded-lg">
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
                                <div className="flex flex-col items-end gap-2 shrink-0">
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
