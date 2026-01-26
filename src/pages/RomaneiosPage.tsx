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
  Trash2,
  Truck,
  MapPin,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRomaneios, useRomaneioItems, useUpdateRomaneioStatus, useDeleteRomaneiosBulk, useUpdateRomaneioTracking, type Romaneio, type RomaneioTrackingData } from '@/hooks/useSupabaseData';
import { EtiquetaEnvioModal } from '@/components/romaneio/EtiquetaEnvioModal';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

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
      case 'enviado':
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Truck className="w-3 h-3 mr-1" />
            Enviado
          </Badge>
        );
      case 'entregue':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Entregue
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status || 'Desconhecido'}
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

  const handleStatusChange = async (id: string, status: string) => {
    await updateRomaneioStatus.mutateAsync({ id, status });
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
          <ReadOnlyGuard>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir selecionados
            </Button>
          </ReadOnlyGuard>
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
            <SelectItem value="enviado">Enviados</SelectItem>
            <SelectItem value="entregue">Entregues</SelectItem>
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
              <TableHead className="text-center">Rastreio</TableHead>
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
                <TableCell className="text-center">
                  {romaneio.codigo_rastreio ? (
                    <div className="flex items-center justify-center gap-1">
                      <Truck className="w-3 h-3 text-primary" />
                      <span className="text-xs font-mono">{romaneio.codigo_rastreio}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
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
        onStatusChange={handleStatusChange}
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
  onStatusChange,
  onPrintEtiqueta,
  formatCurrency,
  formatDate,
  getStatusBadge,
  isUpdating,
}: {
  romaneio: Romaneio | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onPrintEtiqueta: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: string) => string;
  getStatusBadge: (status: Romaneio['status']) => React.ReactNode;
  isUpdating: boolean;
}) {
  const { data: items = [], isLoading: loadingItems } = useRomaneioItems(romaneio?.id || '');
  const updateTracking = useUpdateRomaneioTracking();
  
  // Local state for tracking fields
  const [trackingData, setTrackingData] = useState<RomaneioTrackingData>({
    codigo_rastreio: '',
    transportadora: '',
    data_envio: '',
  });
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Update local state when romaneio changes
  useEffect(() => {
    if (romaneio) {
      setTrackingData({
        codigo_rastreio: romaneio.codigo_rastreio || '',
        transportadora: romaneio.transportadora || '',
        data_envio: romaneio.data_envio ? romaneio.data_envio.split('T')[0] : '',
      });
      setIsEditingTracking(false);
    }
  }, [romaneio]);

  const handleSaveTracking = async () => {
    if (!romaneio) return;
    
    await updateTracking.mutateAsync({
      id: romaneio.id,
      codigo_rastreio: trackingData.codigo_rastreio || null,
      transportadora: trackingData.transportadora || null,
      data_envio: trackingData.data_envio ? new Date(trackingData.data_envio).toISOString() : null,
    });
    setIsEditingTracking(false);
  };

  const handleSendWhatsAppNotification = async (status: string) => {
    if (!romaneio) return;
    
    // Check if we have a phone number (from cliente_telefone or extract from somewhere)
    // For now, we'll open WhatsApp with the message
    setIsSendingWhatsApp(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          tipo: 'rastreio',
          telefone: (romaneio as any).cliente_telefone || '',
          dados: {
            clienteNome: romaneio.cliente_nome,
            romaneioNumero: romaneio.id.slice(-6).toUpperCase(),
            status: status,
            codigoRastreio: romaneio.codigo_rastreio,
            transportadora: romaneio.transportadora,
            dataEnvio: romaneio.data_envio,
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.url) {
        window.open(data.url, '_blank');
        toast.success('Link do WhatsApp aberto!');
      } else {
        // If no phone, just show the message that would be sent
        toast.info('Configure o telefone do cliente para enviar notificação');
      }
    } catch (error) {
      console.error('Erro ao gerar mensagem:', error);
      toast.error('Erro ao gerar mensagem de WhatsApp');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleStatusChangeWithNotification = async (newStatus: string) => {
    if (!romaneio) return;
    
    // First update the status
    onStatusChange(romaneio.id, newStatus);
    
    // Then offer to send WhatsApp notification for relevant statuses
    if (newStatus === 'enviado' || newStatus === 'entregue') {
      // Small delay to let the status update propagate
      setTimeout(() => {
        handleSendWhatsAppNotification(newStatus);
      }, 500);
    }
  };

  const hasTrackingInfo = romaneio?.codigo_rastreio || romaneio?.transportadora || romaneio?.data_envio;

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

              {/* Tracking Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">Rastreamento de Envio</p>
                  </div>
                  {!isEditingTracking && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingTracking(true)}
                      className="h-7 text-xs"
                    >
                      {hasTrackingInfo ? 'Editar' : 'Adicionar'}
                    </Button>
                  )}
                </div>

                {isEditingTracking ? (
                  <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="transportadora" className="text-xs">Transportadora</Label>
                      <Select
                        value={trackingData.transportadora || ''}
                        onValueChange={(value) => setTrackingData(prev => ({ ...prev, transportadora: value }))}
                      >
                        <SelectTrigger id="transportadora" className="h-9">
                          <SelectValue placeholder="Selecione a transportadora" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="correios">Correios</SelectItem>
                          <SelectItem value="jadlog">Jadlog</SelectItem>
                          <SelectItem value="sedex">SEDEX</SelectItem>
                          <SelectItem value="pac">PAC</SelectItem>
                          <SelectItem value="loggi">Loggi</SelectItem>
                          <SelectItem value="melhor_envio">Melhor Envio</SelectItem>
                          <SelectItem value="total_express">Total Express</SelectItem>
                          <SelectItem value="azul_cargo">Azul Cargo</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo_rastreio" className="text-xs">Código de Rastreio</Label>
                      <Input
                        id="codigo_rastreio"
                        placeholder="Ex: BR123456789BR"
                        value={trackingData.codigo_rastreio || ''}
                        onChange={(e) => setTrackingData(prev => ({ ...prev, codigo_rastreio: e.target.value.toUpperCase() }))}
                        className="h-9 font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data_envio" className="text-xs">Data de Envio</Label>
                      <Input
                        id="data_envio"
                        type="date"
                        value={trackingData.data_envio || ''}
                        onChange={(e) => setTrackingData(prev => ({ ...prev, data_envio: e.target.value }))}
                        className="h-9"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingTracking(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveTracking}
                        disabled={updateTracking.isPending}
                        className="flex-1"
                      >
                        {updateTracking.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3 h-3 mr-1" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : hasTrackingInfo ? (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-primary/5 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Transportadora</p>
                      <p className="text-sm font-medium capitalize">{romaneio.transportadora?.replace('_', ' ') || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Código</p>
                      <p className="text-sm font-mono font-medium">{romaneio.codigo_rastreio || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Enviado em</p>
                      <p className="text-sm font-medium">
                        {romaneio.data_envio 
                          ? new Date(romaneio.data_envio).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-secondary/30 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Nenhum dado de envio cadastrado
                    </p>
                  </div>
                )}
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

        <DialogFooter className="flex-col gap-3">
          {/* Status Actions Row */}
          <div className="flex flex-wrap gap-2 w-full justify-end">
            {romaneio?.status === 'pendente' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange(romaneio.id, 'cancelado')}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={isUpdating}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStatusChange(romaneio.id, 'confirmado')}
                  className="bg-success text-success-foreground hover:bg-success/90"
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Confirmar
                </Button>
              </>
            )}
            
            {romaneio?.status === 'confirmado' && (
              <Button
                size="sm"
                onClick={() => handleStatusChangeWithNotification('enviado')}
                className="bg-primary"
                disabled={isUpdating || isSendingWhatsApp}
              >
                {(isUpdating || isSendingWhatsApp) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                <Truck className="w-4 h-4 mr-1" />
                Marcar Enviado
              </Button>
            )}
            
            {romaneio?.status === 'enviado' && (
              <Button
                size="sm"
                onClick={() => handleStatusChangeWithNotification('entregue')}
                className="bg-success text-success-foreground hover:bg-success/90"
                disabled={isUpdating || isSendingWhatsApp}
              >
                {(isUpdating || isSendingWhatsApp) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Marcar Entregue
              </Button>
            )}
          </div>
          
          {/* Tools Row */}
          <div className="flex gap-2 w-full border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrintEtiqueta}
              className="flex-1"
            >
              <Package className="w-4 h-4 mr-1" />
              Etiqueta
            </Button>
            
            {(romaneio?.status === 'enviado' || romaneio?.status === 'entregue') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendWhatsAppNotification(romaneio.status || 'enviado')}
                className="flex-1"
                disabled={isSendingWhatsApp}
              >
                {isSendingWhatsApp ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                WhatsApp
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
