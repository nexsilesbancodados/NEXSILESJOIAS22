import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  User,
  Calendar,
  ShoppingBag,
  Filter,
  Loader2,
  Package,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRomaneios, useRomaneioItems, useUpdateRomaneioStatus, useDeleteRomaneiosBulk, type Romaneio } from '@/hooks/useSupabaseData';
import { EtiquetaEnvioModal } from '@/components/romaneio/EtiquetaEnvioModal';
import { useBulkSelection } from '@/hooks/useBulkSelection';

export default function RomaneiosPage() {
  const { data: romaneios = [], isLoading } = useRomaneios();
  const updateRomaneioStatus = useUpdateRomaneioStatus();
  const deleteRomaneiosBulk = useDeleteRomaneiosBulk();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedRomaneio, setSelectedRomaneio] = useState<Romaneio | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEtiquetaOpen, setIsEtiquetaOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [remetentePadrao, setRemetentePadrao] = useState<Record<string, string>>({});

  // Load saved sender data
  useEffect(() => {
    const savedRemetente = localStorage.getItem('remetente_padrao');
    if (savedRemetente) {
      try {
        setRemetentePadrao(JSON.parse(savedRemetente));
      } catch (e) {
        console.error('Error loading saved sender data');
      }
    }
  }, []);

  const filteredRomaneios = romaneios.filter((romaneio) => {
    const matchesSearch = 
      (romaneio.cliente_nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (romaneio.revendedora_nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      romaneio.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || romaneio.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Bulk selection
  const {
    selectedIds,
    selectedCount,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    clearSelection,
  } = useBulkSelection(filteredRomaneios);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: Romaneio['status']) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'confirmado':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
    }
  };

  const handleConfirmar = async (id: string) => {
    await updateRomaneioStatus.mutateAsync({ id, status: 'confirmado' });
    setIsDetailOpen(false);
    setSelectedRomaneio(null);
  };

  const handleCancelar = async (id: string) => {
    await updateRomaneioStatus.mutateAsync({ id, status: 'cancelado' });
    setIsDetailOpen(false);
    setSelectedRomaneio(null);
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    await deleteRomaneiosBulk.mutateAsync(idsToDelete);
    clearSelection();
    setIsDeleteDialogOpen(false);
  };

  const stats = {
    total: romaneios.length,
    pendentes: romaneios.filter((r) => r.status === 'pendente').length,
    confirmados: romaneios.filter((r) => r.status === 'confirmado').length,
    valorTotal: romaneios
      .filter((r) => r.status === 'confirmado')
      .reduce((acc, r) => acc + Number(r.total), 0),
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Romaneios</h1>
            <p className="text-sm text-muted-foreground">Vendas registradas pelas revendedoras</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MiniGradientCard
          title="Total"
          value={stats.total}
          icon={FileText}
          gradient="purple"
        />
        <MiniGradientCard
          title="Pendentes"
          value={stats.pendentes}
          icon={Clock}
          gradient="orange"
        />
        <MiniGradientCard
          title="Confirmados"
          value={stats.confirmados}
          icon={CheckCircle2}
          gradient="teal"
        />
        <MiniGradientCard
          title="Valor Confirmado"
          value={formatCurrency(stats.valorTotal)}
          icon={ShoppingBag}
          gradient="pink"
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-4 p-3 mb-4 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">
            {selectedCount} item(s) selecionado(s)
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
          >
            Limpar seleção
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir selecionados
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, revendedora ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="confirmado">Confirmados</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Selecionar todos"
                  className={isPartiallySelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Revendedora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRomaneios.map((romaneio) => (
              <TableRow 
                key={romaneio.id} 
                className={cn(
                  "border-border/50 hover:bg-secondary/30 transition-colors",
                  isSelected(romaneio.id) && "bg-primary/5"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected(romaneio.id)}
                    onCheckedChange={() => toggleItem(romaneio.id)}
                    aria-label={`Selecionar romaneio ${romaneio.id}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  #{romaneio.id.slice(-6).toUpperCase()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(romaneio.created_at)}
                </TableCell>
                <TableCell className="font-medium">{romaneio.revendedora_nome || '-'}</TableCell>
                <TableCell>{romaneio.cliente_nome || '-'}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(Number(romaneio.total))}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(romaneio.status)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedRomaneio(romaneio);
                      setIsDetailOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredRomaneios.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum romaneio encontrado</p>
            <p className="text-muted-foreground/60 text-sm">
              Os romaneios aparecerão aqui quando as revendedoras registrarem vendas
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <RomaneioDetailDialog
        romaneio={selectedRomaneio}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onConfirmar={handleConfirmar}
        onCancelar={handleCancelar}
        onPrintEtiqueta={() => {
          setIsDetailOpen(false);
          setIsEtiquetaOpen(true);
        }}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusBadge={getStatusBadge}
        isUpdating={updateRomaneioStatus.isPending}
      />

      {/* Etiqueta de Envio Modal */}
      <EtiquetaEnvioModal
        open={isEtiquetaOpen}
        onOpenChange={setIsEtiquetaOpen}
        romaneio={selectedRomaneio}
        remetenteDefault={remetentePadrao}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir romaneios selecionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedCount} romaneio(s). 
              Esta ação não pode ser desfeita e todos os itens associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRomaneiosBulk.isPending}
            >
              {deleteRomaneiosBulk.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Separate component for detail dialog to handle romaneio items
function RomaneioDetailDialog({
  romaneio,
  isOpen,
  onClose,
  onConfirmar,
  onCancelar,
  onPrintEtiqueta,
  formatCurrency,
  formatDate,
  getStatusBadge,
  isUpdating,
}: {
  romaneio: Romaneio | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: (id: string) => void;
  onCancelar: (id: string) => void;
  onPrintEtiqueta: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: string) => string;
  getStatusBadge: (status: Romaneio['status']) => React.ReactNode;
  isUpdating: boolean;
}) {
  const { data: items = [], isLoading: loadingItems } = useRomaneioItems(romaneio?.id || '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Romaneio #{romaneio?.id.slice(-6).toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Detalhes da venda registrada pela revendedora
          </DialogDescription>
        </DialogHeader>

        {romaneio && (
          <ScrollArea className="max-h-[60vh]">
            <div className="py-4 space-y-4 pr-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Revendedora</p>
                    <p className="font-medium">{romaneio.revendedora_nome || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium">{romaneio.cliente_nome || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-medium">{formatDate(romaneio.created_at)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(romaneio.status)}</div>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3">Itens da Venda</p>
                {loadingItems ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.peca_nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantidade}x {formatCurrency(Number(item.preco_unitario))}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(Number(item.preco_unitario) * item.quantidade)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="font-medium">Total</span>
                <span className="text-xl font-display font-semibold text-primary">
                  {formatCurrency(Number(romaneio.total))}
                </span>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Botão de Etiqueta - sempre visível */}
          <Button
            variant="outline"
            onClick={onPrintEtiqueta}
            className="w-full sm:w-auto"
          >
            <Package className="w-4 h-4 mr-2" />
            Etiqueta de Envio
          </Button>

          <div className="flex gap-2 w-full sm:w-auto">
            {romaneio?.status === 'pendente' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onCancelar(romaneio.id)}
                  className="flex-1 sm:flex-none text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={isUpdating}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={() => onConfirmar(romaneio.id)}
                  className="flex-1 sm:flex-none bg-success text-success-foreground hover:bg-success/90"
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar
                </Button>
              </>
            )}
            {romaneio?.status !== 'pendente' && (
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
