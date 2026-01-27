import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrganizationIdAsync } from '@/hooks/useOrganization';
import { translateDatabaseError } from '@/lib/error-utils';

const db = supabase;
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Package, 
  Loader2, 
  User,
  Phone,
  Mail,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  ExternalLink,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const STATUS_PEDIDO = [
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-600', icon: Clock },
  { value: 'aprovado', label: 'Aprovado', color: 'bg-blue-500/20 text-blue-600', icon: CheckCircle },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-500/20 text-green-600', icon: CheckCircle },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500/20 text-red-600', icon: XCircle },
];

interface PedidoCatalogo {
  id: string;
  catalogo_id: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  endereco: string | null;
  total: number;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  catalogo?: {
    nome: string;
  };
}

interface PedidoCatalogoItem {
  id: string;
  pedido_id: string;
  peca_id: string;
  quantidade: number;
  preco_unitario: number;
  created_at: string;
  peca?: {
    id: string;
    nome: string;
    codigo: string | null;
    imagem_url: string | null;
    categoria: string | null;
    material: string | null;
  } | null;
}

interface Props {
  catalogoId?: string;
}

export function PedidosCatalogoList({ catalogoId }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedPedido, setSelectedPedido] = useState<PedidoCatalogo | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [lastCreatedRomaneioId, setLastCreatedRomaneioId] = useState<string | null>(null);
  const [showRomaneioLink, setShowRomaneioLink] = useState(false);
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-catalogo', catalogoId],
    queryFn: async () => {
      let query = db
        .from('pedidos_catalogo')
        .select(`
          *,
          catalogo:catalogos(nome)
        `)
        .order('created_at', { ascending: false });

      if (catalogoId) {
        query = query.eq('catalogo_id', catalogoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PedidoCatalogo[];
    },
  });

  const { data: pedidoItens = [], isLoading: loadingItens } = useQuery({
    queryKey: ['pedido-itens', selectedPedido?.id],
    queryFn: async () => {
      if (!selectedPedido) return [];
      const { data, error } = await db
        .from('pedidos_catalogo_itens')
        .select(`
          *,
          peca:pecas(id, nome, codigo, imagem_url, categoria, material)
        `)
        .eq('pedido_id', selectedPedido.id);
      if (error) throw error;
      return data as PedidoCatalogoItem[];
    },
    enabled: !!selectedPedido,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, pedido }: { id: string; status: string; pedido?: PedidoCatalogo }) => {
      const { error } = await db
        .from('pedidos_catalogo')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      // Se confirmado, criar romaneio automaticamente
      if (status === 'confirmado' && pedido) {
        // Buscar user logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar itens do pedido
        const { data: itens, error: itensError } = await db
          .from('pedidos_catalogo_itens')
          .select('*')
          .eq('pedido_id', id);
        if (itensError) throw itensError;

        // Criar romaneio - usando organization_id para garantir isolamento multi-tenant
        const organizationId = await getOrganizationIdAsync();
        if (!organizationId) throw new Error('Organização não encontrada');

        const { data: romaneio, error: romaneioError } = await db
          .from('romaneios')
          .insert({
            organization_id: organizationId,
            cliente_nome: pedido.cliente_nome,
            cliente_telefone: pedido.cliente_telefone || null,
            status: 'pendente',
          })
          .select()
          .single();

        if (romaneioError) {
          console.error('Erro ao criar romaneio:', romaneioError);
          throw romaneioError;
        }

        // Criar itens do romaneio
        if (itens && itens.length > 0 && romaneio) {
          const romaneioItens = itens.map((item: PedidoCatalogoItem) => ({
            romaneio_id: romaneio.id,
            peca_id: item.peca_id,
            quantidade: item.quantidade,
          }));

          // Correct table name is 'romaneios_pecas'
          const { error: itensRomaneioError } = await db
            .from('romaneios_pecas')
            .insert(romaneioItens);

          if (itensRomaneioError) {
            console.error('Erro ao criar itens do romaneio:', itensRomaneioError);
            throw itensRomaneioError;
          }
        }

        return { romaneioCreated: true, romaneioId: romaneio.id };
      }

      return { romaneioCreated: false, romaneioId: null };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-catalogo'] });
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      if (result?.romaneioCreated && result?.romaneioId) {
        setLastCreatedRomaneioId(result.romaneioId);
        setShowRomaneioLink(true);
        toast.success(
          <div className="flex items-center gap-2">
            <span>Pedido confirmado e romaneio criado!</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 px-2 text-xs"
              onClick={() => navigate('/romaneios')}
            >
              <Truck className="w-3 h-3 mr-1" />
              Ver Romaneio
            </Button>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.success('Status atualizado!');
      }
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  const deletePedido = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('pedidos_catalogo')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-catalogo'] });
      setIsDeleteOpen(false);
      setSelectedPedido(null);
      toast.success('Pedido excluído!');
    },
    onError: (err) => {
      toast.error(translateDatabaseError(err, 'excluir pedido'));
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusInfo = (status: string) => {
    return STATUS_PEDIDO.find(s => s.value === status) || STATUS_PEDIDO[0];
  };

  const handleViewDetails = (pedido: PedidoCatalogo) => {
    setSelectedPedido(pedido);
    setIsDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum pedido recebido ainda.</p>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = pedidos.filter(p => p.status === 'pendente').length;

  return (
    <>
      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Pedidos Recebidos</h3>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-600">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Badge variant="secondary">{pedidos.length} total</Badge>
      </div>

      {/* List */}
      <div className="space-y-3">
        {pedidos.map((pedido) => {
          const statusInfo = getStatusInfo(pedido.status);
          const StatusIcon = statusInfo.icon;
          return (
            <Card key={pedido.id} className="glass-card hover-lift">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium truncate">{pedido.cliente_nome}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {pedido.cliente_telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {pedido.cliente_telefone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    {!catalogoId && pedido.catalogo && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Catálogo: {pedido.catalogo.nome}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">{formatCurrency(pedido.total)}</p>
                    <Badge className={cn('text-xs mt-1', statusInfo.color)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-center gap-2 flex-wrap">
                  {pedido.status === 'pendente' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => updateStatus.mutate({ id: pedido.id, status: 'confirmado', pedido })}
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Aprovar e Criar Romaneio
                    </Button>
                  )}

                  {pedido.status === 'confirmado' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10"
                      onClick={() => navigate('/romaneios')}
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      Ver Romaneio
                    </Button>
                  )}

                  <Select
                    value={pedido.status}
                    onValueChange={(value) => updateStatus.mutate({ id: pedido.id, status: value, pedido })}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_PEDIDO.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(pedido)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Itens
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive ml-auto"
                    onClick={() => {
                      setSelectedPedido(pedido);
                      setIsDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              Pedido de {selectedPedido?.cliente_nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedPedido?.cliente_nome}</span>
              </div>
              {selectedPedido?.cliente_telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${selectedPedido.cliente_telefone}`} className="text-primary hover:underline">
                    {selectedPedido.cliente_telefone}
                  </a>
                </div>
              )}
              {selectedPedido?.cliente_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${selectedPedido.cliente_email}`} className="text-primary hover:underline">
                    {selectedPedido.cliente_email}
                  </a>
                </div>
              )}
              {selectedPedido?.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(selectedPedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Itens do Pedido ({pedidoItens.length})
              </h4>
              {loadingItens ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : pedidoItens.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum item encontrado
                </p>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3 pr-2">
                    {pedidoItens.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                        {/* Product Image */}
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                          {item.peca?.imagem_url ? (
                            <img 
                              src={item.peca.imagem_url} 
                              alt={item.peca?.nome || 'Produto'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.peca?.nome || 'Produto não encontrado'}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                            {item.peca?.codigo && (
                              <span>Cód: {item.peca.codigo}</span>
                            )}
                            {item.peca?.categoria && (
                              <span>{item.peca.categoria}</span>
                            )}
                            {item.peca?.material && (
                              <span>{item.peca.material}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.quantidade}x {formatCurrency(item.preco_unitario || 0)}
                            </Badge>
                            <span className="font-semibold text-primary text-sm">
                              {formatCurrency((item.quantidade || 0) * (item.preco_unitario || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Totals */}
            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({pedidoItens.length} {pedidoItens.length === 1 ? 'item' : 'itens'})</span>
                <span>{formatCurrency(pedidoItens.reduce((acc, item) => acc + (item.quantidade || 0) * (item.preco_unitario || 0), 0))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(selectedPedido?.total || pedidoItens.reduce((acc, item) => acc + (item.quantidade || 0) * (item.preco_unitario || 0), 0))}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pedido de {selectedPedido?.cliente_nome}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPedido && deletePedido.mutate(selectedPedido.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
