import { useState, memo, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

// Use loose typing to bypass schema validation until migrations are applied
const db = supabase as any;
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  Loader2, 
  User,
  Phone,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  MessageCircle,
  Package,
  Share2,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PedidoDetailsDialog } from '@/components/pedido/PedidoDetailsDialog';
import { useCatalogos } from '@/hooks/useSupabaseData';

const STATUS_PEDIDO = [
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-600', icon: Clock },
  { value: 'confirmado', label: 'Vendido', color: 'bg-green-500/20 text-green-600', icon: CheckCircle },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500/20 text-red-600', icon: XCircle },
];

interface PedidoCatalogo {
  id: string;
  catalogo_id: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  endereco?: string | null;
  total: number;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at?: string;
  catalogo?: {
    nome: string;
  };
}

interface PedidoCatalogoItem {
  id: string;
  pedido_id: string;
  peca_id: string;
  peca_nome: string;
  peca_codigo: string;
  quantidade: number;
  preco_unitario: number;
  created_at: string;
}

export const MeusPedidosTab = memo(function MeusPedidosTab() {
  const queryClient = useQueryClient();
  const [selectedPedido, setSelectedPedido] = useState<PedidoCatalogo | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: catalogos = [] } = useCatalogos();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-catalogo-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // First get the user's catalogs
      const { data: userCatalogos } = await supabase
        .from('catalogos')
        .select('id')
        .eq('user_id', user?.id);
      
      const catalogoIds = userCatalogos?.map(c => c.id) || [];
      
      if (catalogoIds.length === 0) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('pedidos_catalogo')
        .select(`
          *,
          catalogo:catalogos(nome)
        `)
        .in('catalogo_id', catalogoIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PedidoCatalogo[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, pedido }: { id: string; status: string; pedido?: PedidoCatalogo }) => {
      const { error } = await supabase
        .from('pedidos_catalogo')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      // Se confirmado (vendido), atualizar estoque das peças
      if (status === 'confirmado') {
        const { data: itens } = await supabase
          .from('pedidos_catalogo_itens')
          .select('*')
          .eq('pedido_id', id);

        if (itens) {
          for (const item of itens) {
            // Buscar estoque atual
            const { data: peca } = await supabase
              .from('pecas')
              .select('estoque')
              .eq('id', item.peca_id)
              .single();
              
            if (peca) {
              await supabase
                .from('pecas')
                .update({ estoque: Math.max(0, peca.estoque - item.quantidade) })
                .eq('id', item.peca_id);
            }
          }
        }
      }

      return { status, pedido };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-catalogo'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-catalogo-all'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      
      if (result?.status === 'confirmado') {
        toast.success('Pedido marcado como vendido! Estoque atualizado.');
      } else if (result?.status === 'cancelado') {
        toast.success('Pedido cancelado!');
      } else {
        toast.success('Status atualizado!');
      }
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const deletePedido = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pedidos_catalogo')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-catalogo-all'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-stats'] });
      setIsDeleteOpen(false);
      setSelectedPedido(null);
      toast.success('Pedido excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir pedido');
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

  const handleCopyLink = (catalogoId: string) => {
    const link = `${window.location.origin}/catalogo/${catalogoId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link do catálogo copiado!');
  };

  const handleShareWhatsApp = (catalogo: { id: string; nome: string }) => {
    const link = `${window.location.origin}/catalogo/${catalogo.id}`;
    const message = encodeURIComponent(
      `🛍️ *${catalogo.nome}*\n\nConfira nosso catálogo e faça seu pedido:\n${link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const pendingPedidos = useMemo(() => 
    pedidos.filter(p => p.status === 'pendente'), 
    [pedidos]
  );

  const otherPedidos = useMemo(() => 
    pedidos.filter(p => p.status !== 'pendente'), 
    [pedidos]
  );

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
          <h3 className="font-semibold mb-2">Nenhum pedido recebido</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Compartilhe o link do seu catálogo para receber pedidos dos clientes.
          </p>
          
          {catalogos.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {catalogos.slice(0, 3).map((catalogo) => (
                <div key={catalogo.id} className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(catalogo.id)}
                    className="gap-1"
                  >
                    <Link2 className="w-3 h-3" />
                    {catalogo.nome}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShareWhatsApp({ id: catalogo.id, nome: catalogo.nome })}
                    className="px-2"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Share Catalog Section */}
      {catalogos.length > 0 && (
        <Card className="glass-card mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                <span className="font-medium">Compartilhar Catálogo</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {catalogos.slice(0, 3).map((catalogo) => (
                  <div key={catalogo.id} className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(catalogo.id)}
                      className="gap-1.5"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {catalogo.nome}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleShareWhatsApp({ id: catalogo.id, nome: catalogo.nome })}
                      className="gap-1.5 bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Orders Section */}
      {pendingPedidos.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-warning" />
            <h3 className="font-semibold">Pedidos Pendentes</h3>
            <Badge className="bg-warning/20 text-warning">{pendingPedidos.length}</Badge>
          </div>
          
          <div className="grid gap-3">
            {pendingPedidos.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onViewDetails={() => {
                  setSelectedPedido(pedido);
                  setIsDetailsOpen(true);
                }}
                onMarkAsSold={() => updateStatus.mutate({ id: pedido.id, status: 'confirmado', pedido })}
                onCancel={() => updateStatus.mutate({ id: pedido.id, status: 'cancelado', pedido })}
                onDelete={() => {
                  setSelectedPedido(pedido);
                  setIsDeleteOpen(true);
                }}
                isPending={updateStatus.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Orders Section */}
      {otherPedidos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Histórico de Pedidos</h3>
            <Badge variant="secondary">{otherPedidos.length}</Badge>
          </div>
          
          <div className="grid gap-3">
            {otherPedidos.slice(0, 10).map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onViewDetails={() => {
                  setSelectedPedido(pedido);
                  setIsDetailsOpen(true);
                }}
                onDelete={() => {
                  setSelectedPedido(pedido);
                  setIsDeleteOpen(true);
                }}
                isPending={updateStatus.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Details Dialog - Using new component */}
      <PedidoDetailsDialog
        pedido={selectedPedido}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onMarkAsSold={() => selectedPedido && updateStatus.mutate({ 
          id: selectedPedido.id, 
          status: 'confirmado', 
          pedido: selectedPedido 
        })}
        onCancel={() => selectedPedido && updateStatus.mutate({ 
          id: selectedPedido.id, 
          status: 'cancelado', 
          pedido: selectedPedido 
        })}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedPedido && deletePedido.mutate(selectedPedido.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

// Pedido Card Component
const PedidoCard = memo(function PedidoCard({
  pedido,
  onViewDetails,
  onMarkAsSold,
  onCancel,
  onDelete,
  isPending,
}: {
  pedido: PedidoCatalogo;
  onViewDetails: () => void;
  onMarkAsSold?: () => void;
  onCancel?: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const statusInfo = STATUS_PEDIDO.find(s => s.value === pedido.status) || STATUS_PEDIDO[0];
  const StatusIcon = statusInfo.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="glass-card hover-lift">
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
                {format(new Date(pedido.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            {pedido.catalogo && (
              <p className="text-xs text-muted-foreground mt-1">
                {pedido.catalogo.nome}
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
            <>
              <Button
                size="sm"
                className="gap-1 bg-success hover:bg-success/90"
                onClick={onMarkAsSold}
                disabled={isPending}
              >
                <CheckCircle className="w-4 h-4" />
                Marcar Vendido
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={onCancel}
                disabled={isPending}
              >
                <XCircle className="w-4 h-4" />
                Cancelar
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver Itens
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive ml-auto"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
