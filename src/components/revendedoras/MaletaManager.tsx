import { useState, useMemo, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Package,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  Check,
  RotateCcw,
  Search,
  Eye,
  Edit2,
  Loader2,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Percent,
  Lock,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useMaletaItems,
  useAddMaletaItem,
  useUpdateMaletaItem,
  useDeleteMaletaItem,
  useCloseMaleta,
  usePecas,
  type Maleta,
  type MaletaItem,
  type Peca,
} from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

interface MaletaManagerProps {
  maleta: Maleta;
  comissaoPercentual: number;
  onClose?: () => void;
}

export const MaletaManager = forwardRef<HTMLDivElement, MaletaManagerProps>(
  function MaletaManager({ maleta, comissaoPercentual, onClose }, ref) {
  const { data: items = [], isLoading: isLoadingItems } = useMaletaItems(maleta.id);
  const { data: pecas = [] } = usePecas();
  
  const addMaletaItemMutation = useAddMaletaItem();
  const updateMaletaItemMutation = useUpdateMaletaItem();
  const deleteMaletaItemMutation = useDeleteMaletaItem();
  const closeMaletaMutation = useCloseMaleta();

  // State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchPeca, setSearchPeca] = useState('');
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState<Record<string, number>>({});
  
  // Modal states
  const [vendaModal, setVendaModal] = useState<{ open: boolean; item: MaletaItem | null }>({ open: false, item: null });
  const [editQtdModal, setEditQtdModal] = useState<{ open: boolean; item: MaletaItem | null }>({ open: false, item: null });
  const [detalhesModal, setDetalhesModal] = useState<{ open: boolean; peca: Peca | null }>({ open: false, peca: null });
  const [fecharMaletaModal, setFecharMaletaModal] = useState(false);
  const [quantidadeVenda, setQuantidadeVenda] = useState(1);
  const [novaQuantidade, setNovaQuantidade] = useState(1);

  // Computed values
  const itemsVendidos = items.filter(i => i.status === 'vendido');
  const itemsPendentes = items.filter(i => i.status === 'pendente');
  
  const totalPecas = items.reduce((acc, i) => acc + (i.quantidade || 1), 0);
  const pecasVendidas = itemsVendidos.reduce((acc, i) => acc + (i.quantidade || 1), 0);
  const pecasPendentes = itemsPendentes.reduce((acc, i) => acc + (i.quantidade || 1), 0);
  
  const valorTotal = items.reduce((acc, i) => acc + ((i.peca?.preco_venda || 0) * (i.quantidade || 1)), 0);
  const valorVendido = itemsVendidos.reduce((acc, i) => acc + ((i.peca?.preco_venda || 0) * (i.quantidade || 1)), 0);
  const valorPendente = itemsPendentes.reduce((acc, i) => acc + ((i.peca?.preco_venda || 0) * (i.quantidade || 1)), 0);
  
  const comissaoEstimada = (valorVendido * comissaoPercentual) / 100;
  const percentualVendido = totalPecas > 0 ? (pecasVendidas / totalPecas) * 100 : 0;

  // Peças disponíveis para adicionar (com estoque e não na maleta)
  const pecasDisponiveis = useMemo(() => {
    const idsNaMaleta = new Set(items.map(i => i.peca_id));
    return pecas.filter(p => 
      !p.catalogo_only && 
      (p.estoque || 0) > 0 && 
      !idsNaMaleta.has(p.id) &&
      (searchPeca === '' || 
        p.nome?.toLowerCase().includes(searchPeca.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchPeca.toLowerCase()) ||
        p.categoria?.toLowerCase().includes(searchPeca.toLowerCase())
      )
    );
  }, [pecas, items, searchPeca]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Handlers
  const handleAdicionarPeca = async (peca: Peca, quantidade: number) => {
    if (quantidade <= 0 || quantidade > (peca.estoque || 0)) {
      toast.error('Quantidade inválida');
      return;
    }

    try {
      await addMaletaItemMutation.mutateAsync({
        maletaId: maleta.id,
        pecaId: peca.id,
        quantidade,
      });
      setQuantidadeAdicionar(prev => ({ ...prev, [peca.id]: 1 }));
    } catch (error) {
      console.error('Error adding peca:', error);
    }
  };

  const handleMarcarVendido = async () => {
    if (!vendaModal.item) return;
    
    const item = vendaModal.item;
    const qtdTotal = item.quantidade || 1;

    try {
      await updateMaletaItemMutation.mutateAsync({
        id: item.id,
        status: 'vendido',
        pecaId: item.peca_id,
        statusAnterior: 'pendente',
        quantidade: quantidadeVenda,
        quantidadeVendida: quantidadeVenda,
        quantidadeTotal: qtdTotal,
      });
      setVendaModal({ open: false, item: null });
      setQuantidadeVenda(1);
    } catch (error) {
      console.error('Error marking as sold:', error);
    }
  };

  const handleDevolver = async (item: MaletaItem) => {
    if (!window.confirm(`Devolver "${item.peca?.nome}" ao estoque?`)) return;
    
    try {
      await updateMaletaItemMutation.mutateAsync({
        id: item.id,
        status: 'devolvido',
        pecaId: item.peca_id,
        statusAnterior: 'pendente',
        quantidade: item.quantidade || 1,
      });
    } catch (error) {
      console.error('Error returning item:', error);
    }
  };

  const handleEditarQuantidade = async () => {
    if (!editQtdModal.item || novaQuantidade < 1) return;

    const item = editQtdModal.item;
    const qtdAtual = item.quantidade || 1;
    const diferenca = novaQuantidade - qtdAtual;

    // Check if we have enough stock for increase
    if (diferenca > 0) {
      const pecaEstoque = item.peca?.estoque || 0;
      if (diferenca > pecaEstoque) {
        toast.error(`Estoque insuficiente. Disponível: ${pecaEstoque}`);
        return;
      }
    }

    // For now, we update by removing and re-adding with new quantity
    // This is a simplified approach - could be optimized with a specific mutation
    try {
      // Delete current item (returns to stock)
      await deleteMaletaItemMutation.mutateAsync({
        id: item.id,
        pecaId: item.peca_id,
        returnToStock: true,
      });

      // Re-add with new quantity
      await addMaletaItemMutation.mutateAsync({
        maletaId: maleta.id,
        pecaId: item.peca_id,
        quantidade: novaQuantidade,
      });

      setEditQtdModal({ open: false, item: null });
      toast.success('Quantidade atualizada!');
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoverItem = async (item: MaletaItem) => {
    if (!window.confirm(`Remover "${item.peca?.nome}" da maleta e devolver ao estoque?`)) return;
    
    try {
      await deleteMaletaItemMutation.mutateAsync({
        id: item.id,
        pecaId: item.peca_id,
        returnToStock: true,
      });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const openVendaModal = (item: MaletaItem) => {
    setQuantidadeVenda(item.quantidade || 1);
    setVendaModal({ open: true, item });
  };

  const openEditQtdModal = (item: MaletaItem) => {
    setNovaQuantidade(item.quantidade || 1);
    setEditQtdModal({ open: true, item });
  };

  const handleFecharMaleta = async () => {
    try {
      await closeMaletaMutation.mutateAsync({
        maletaId: maleta.id,
        returnPendingToStock: true,
      });
      setFecharMaletaModal(false);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error closing maleta:', error);
    }
  };

  const isPending = addMaletaItemMutation.isPending || updateMaletaItemMutation.isPending || deleteMaletaItemMutation.isPending || closeMaletaMutation.isPending;

  return (
    <div ref={ref} className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-medium">Total Maleta</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(valorTotal)}</p>
            <p className="text-xs text-muted-foreground">{totalPecas} peças</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-success mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Vendido</span>
            </div>
            <p className="text-xl font-bold text-success">{formatCurrency(valorVendido)}</p>
            <p className="text-xs text-muted-foreground">{pecasVendidas} peças</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-warning mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium">Pendente</span>
            </div>
            <p className="text-xl font-bold text-warning">{formatCurrency(valorPendente)}</p>
            <p className="text-xs text-muted-foreground">{pecasPendentes} peças</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-foreground mb-1">
              <Percent className="w-4 h-4" />
              <span className="text-xs font-medium">Comissão ({comissaoPercentual}%)</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(comissaoEstimada)}</p>
            <p className="text-xs text-muted-foreground">{percentualVendido.toFixed(0)}% vendido</p>
          </CardContent>
        </Card>
      </div>

      {/* Close Maleta Button */}
      {maleta.status === 'aberta' && (
        <div className="flex justify-end">
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90"
            onClick={() => setFecharMaletaModal(true)}
            disabled={isPending}
          >
            <Lock className="w-4 h-4 mr-2" />
            Fechar Maleta
          </Button>
        </div>
      )}

      {/* Maleta Fechada Banner */}
      {maleta.status === 'fechada' && (
        <Card className="bg-muted/50 border-muted-foreground/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Maleta Fechada</p>
              <p className="text-sm text-muted-foreground">
                Esta maleta foi fechada. Total vendido: {formatCurrency(valorVendido)} | 
                Comissão: {formatCurrency(comissaoEstimada)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Pieces Section (Collapsible) */}
      {maleta.status === 'aberta' && (
        <Collapsible open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Peças do Estoque
                  </CardTitle>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isAddOpen && "rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, código ou categoria..."
                    value={searchPeca}
                    onChange={(e) => setSearchPeca(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {pecasDisponiveis.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {searchPeca ? 'Nenhuma peça encontrada' : 'Todas as peças já estão na maleta ou sem estoque'}
                      </p>
                    ) : (
                      pecasDisponiveis.map((peca) => {
                        const qtd = quantidadeAdicionar[peca.id] || 1;
                        return (
                          <div
                            key={peca.id}
                            className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                          >
                            <img
                              src={peca.imagem_url || '/placeholder.svg'}
                              alt={peca.nome}
                              className="w-10 h-10 rounded object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{peca.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {peca.codigo} • Est: {peca.estoque} • {formatCurrency(peca.preco_venda || 0)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => setQuantidadeAdicionar(prev => ({ ...prev, [peca.id]: Math.max(1, qtd - 1) }))}
                                disabled={qtd <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{qtd}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => setQuantidadeAdicionar(prev => ({ ...prev, [peca.id]: Math.min(peca.estoque || 1, qtd + 1) }))}
                                disabled={qtd >= (peca.estoque || 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 bg-primary"
                                onClick={() => handleAdicionarPeca(peca, qtd)}
                                disabled={isPending}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Peças na Maleta ({totalPecas})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingItems ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mb-2 opacity-50" />
              <p>Nenhuma peça na maleta</p>
              <p className="text-sm">Adicione peças usando a seção acima</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Foto</TableHead>
                    <TableHead>Peça</TableHead>
                    <TableHead className="text-center w-[80px]">Qtd</TableHead>
                    <TableHead className="text-right w-[100px]">Preço Un.</TableHead>
                    <TableHead className="text-right w-[100px]">Subtotal</TableHead>
                    <TableHead className="text-center w-[80px]">Status</TableHead>
                    <TableHead className="text-right w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const preco = item.peca?.preco_venda || 0;
                    const qtd = item.quantidade || 1;
                    const subtotal = preco * qtd;
                    const isVendido = item.status === 'vendido';

                    return (
                      <TableRow key={item.id} className={cn(isVendido && "bg-success/5")}>
                        <TableCell>
                          <img
                            src={item.peca?.imagem_url || '/placeholder.svg'}
                            alt={item.peca?.nome}
                            className="w-10 h-10 rounded object-cover"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.peca?.nome}</p>
                            <p className="text-xs text-muted-foreground">{item.peca?.codigo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{qtd}</TableCell>
                        <TableCell className="text-right">{formatCurrency(preco)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(subtotal)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isVendido ? 'default' : 'secondary'} className={cn(isVendido && "bg-success")}>
                            {isVendido ? 'Vendido' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {maleta.status === 'aberta' && !isVendido && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-success hover:bg-success/10"
                                  onClick={() => openVendaModal(item)}
                                  disabled={isPending}
                                  title="Marcar como vendido"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 hover:bg-secondary"
                                  onClick={() => handleDevolver(item)}
                                  disabled={isPending}
                                  title="Devolver ao estoque"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 hover:bg-secondary"
                                  onClick={() => openEditQtdModal(item)}
                                  disabled={isPending}
                                  title="Editar quantidade"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRemoverItem(item)}
                                  disabled={isPending}
                                  title="Remover da maleta"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:bg-secondary"
                              onClick={() => setDetalhesModal({ open: true, peca: item.peca as Peca })}
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Marcar Vendido */}
      <Dialog open={vendaModal.open} onOpenChange={(open) => setVendaModal({ open, item: vendaModal.item })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Venda</DialogTitle>
            <DialogDescription>Quantas unidades foram vendidas?</DialogDescription>
          </DialogHeader>
          {vendaModal.item && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <img
                  src={vendaModal.item.peca?.imagem_url || '/placeholder.svg'}
                  alt={vendaModal.item.peca?.nome}
                  className="w-12 h-12 rounded object-cover"
                />
                <div>
                  <p className="font-medium">{vendaModal.item.peca?.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(vendaModal.item.peca?.preco_venda || 0)} × {quantidadeVenda} = {formatCurrency((vendaModal.item.peca?.preco_venda || 0) * quantidadeVenda)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quantidade vendida (máx: {vendaModal.item.quantidade || 1})</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantidadeVenda(q => Math.max(1, q - 1))}
                    disabled={quantidadeVenda <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantidadeVenda}
                    onChange={(e) => setQuantidadeVenda(Math.min(vendaModal.item!.quantidade || 1, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center text-lg font-bold"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantidadeVenda(q => Math.min(vendaModal.item!.quantidade || 1, q + 1))}
                    disabled={quantidadeVenda >= (vendaModal.item.quantidade || 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {quantidadeVenda < (vendaModal.item.quantidade || 1) && (
                <p className="text-sm text-muted-foreground text-center">
                  {(vendaModal.item.quantidade || 1) - quantidadeVenda} unidade(s) permanecerão pendentes
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVendaModal({ open: false, item: null })}>Cancelar</Button>
            <Button onClick={handleMarcarVendido} disabled={isPending} className="bg-success hover:bg-success/90">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Quantidade */}
      <Dialog open={editQtdModal.open} onOpenChange={(open) => setEditQtdModal({ open, item: editQtdModal.item })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Quantidade</DialogTitle>
            <DialogDescription>Altere a quantidade desta peça na maleta</DialogDescription>
          </DialogHeader>
          {editQtdModal.item && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <img
                  src={editQtdModal.item.peca?.imagem_url || '/placeholder.svg'}
                  alt={editQtdModal.item.peca?.nome}
                  className="w-12 h-12 rounded object-cover"
                />
                <div>
                  <p className="font-medium">{editQtdModal.item.peca?.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Estoque disponível: {editQtdModal.item.peca?.estoque || 0}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nova quantidade</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setNovaQuantidade(q => Math.max(1, q - 1))}
                    disabled={novaQuantidade <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={novaQuantidade}
                    onChange={(e) => setNovaQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center text-lg font-bold"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setNovaQuantidade(q => q + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditQtdModal({ open: false, item: null })}>Cancelar</Button>
            <Button onClick={handleEditarQuantidade} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalhes da Peça */}
      <Dialog open={detalhesModal.open} onOpenChange={(open) => setDetalhesModal({ open, peca: detalhesModal.peca })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Peça</DialogTitle>
          </DialogHeader>
          {detalhesModal.peca && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={detalhesModal.peca.imagem_url || '/placeholder.svg'}
                  alt={detalhesModal.peca.nome}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{detalhesModal.peca.nome}</p>
                  <p className="text-sm text-muted-foreground">Código: {detalhesModal.peca.codigo}</p>
                  {detalhesModal.peca.categoria && (
                    <Badge variant="secondary">{detalhesModal.peca.categoria}</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Preço de Venda</p>
                  <p className="font-medium">{formatCurrency(detalhesModal.peca.preco_venda || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Preço de Custo</p>
                  <p className="font-medium">{formatCurrency(detalhesModal.peca.preco_custo || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estoque Atual</p>
                  <p className="font-medium">{detalhesModal.peca.estoque || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Material</p>
                  <p className="font-medium">{detalhesModal.peca.material || '-'}</p>
                </div>
              </div>
              {detalhesModal.peca.descricao && (
                <div>
                  <p className="text-muted-foreground text-sm">Descrição</p>
                  <p className="text-sm">{detalhesModal.peca.descricao}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalhesModal({ open: false, peca: null })}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Fechar Maleta com Resumo */}
      <Dialog open={fecharMaletaModal} onOpenChange={setFecharMaletaModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fechar Maleta - Resumo Final
            </DialogTitle>
            <DialogDescription>
              Revise o resumo antes de fechar a maleta "{maleta.nome}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumo de Peças */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold">{totalPecas}</p>
                <p className="text-xs text-muted-foreground">Total Peças</p>
              </div>
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{pecasVendidas}</p>
                <p className="text-xs text-muted-foreground">Vendidas</p>
              </div>
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <p className="text-2xl font-bold text-warning">{pecasPendentes}</p>
                <p className="text-xs text-muted-foreground">A devolver</p>
              </div>
            </div>

            <Separator />

            {/* Resumo Financeiro */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Valor total em vendas:</span>
                <span className="font-semibold text-success">{formatCurrency(valorVendido)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Valor devolvido ao estoque:</span>
                <span className="font-semibold text-warning">{formatCurrency(valorPendente)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-3">
                <div>
                  <span className="font-medium">Comissão a pagar ({comissaoPercentual}%)</span>
                  <p className="text-xs text-muted-foreground">Sobre o valor vendido</p>
                </div>
                <span className="text-xl font-bold text-primary">{formatCurrency(comissaoEstimada)}</span>
              </div>
            </div>

            {pecasPendentes > 0 && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Atenção</p>
                  <p className="text-muted-foreground">
                    {pecasPendentes} peça(s) pendente(s) serão automaticamente devolvidas ao estoque ao fechar a maleta.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFecharMaletaModal(false)} disabled={closeMaletaMutation.isPending}>
              Cancelar
            </Button>
            <Button 
              onClick={handleFecharMaleta} 
              disabled={closeMaletaMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {closeMaletaMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

MaletaManager.displayName = 'MaletaManager';
