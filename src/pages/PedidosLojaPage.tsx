import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Package, ShoppingBag, Truck, CheckCircle, Clock, Loader2, Eye, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning' },
  pago: { label: 'Pago', color: 'bg-primary/10 text-primary' },
  enviado: { label: 'Enviado', color: 'bg-blue-500/10 text-blue-600' },
  entregue: { label: 'Entregue', color: 'bg-success/10 text-success' },
  cancelado: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive' },
};

export default function PedidosLojaPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedPedido, setSelectedPedido] = useState<any>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['ecommerce-pedidos', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('ecommerce_pedidos' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter !== 'todos') query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: pedidoItens = [] } = useQuery({
    queryKey: ['ecommerce-pedido-itens', selectedPedido?.id],
    queryFn: async () => {
      if (!selectedPedido) return [];
      const { data } = await supabase
        .from('ecommerce_pedido_itens' as any)
        .select('*, pecas:peca_id(nome, codigo, imagem_url)')
        .eq('pedido_id', selectedPedido.id);
      return (data as any[]) || [];
    },
    enabled: !!selectedPedido,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ecommerce_pedidos' as any)
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedidos'] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const formatCurrency = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalVendas = pedidos.filter(p => p.status !== 'cancelado').reduce((sum: number, p: any) => sum + (p.valor_total || 0), 0);

  return (
    <div className="p-8 animate-fade-in">
      <PageHeader
        title="Pedidos da Loja"
        subtitle="Gerencie os pedidos do e-commerce"
        icon={ShoppingBag}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card"><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Total Pedidos</p>
          <p className="text-2xl font-bold text-foreground">{pedidos.length}</p>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Faturamento</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalVendas)}</p>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Pagos</p>
          <p className="text-2xl font-bold text-primary">{pedidos.filter((p: any) => p.status === 'pago').length}</p>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Enviados</p>
          <p className="text-2xl font-bold text-foreground">{pedidos.filter((p: any) => p.status === 'enviado').length}</p>
        </CardContent></Card>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido: any) => {
            const statusInfo = STATUS_MAP[pedido.status] || STATUS_MAP.pendente;
            return (
              <Card key={pedido.id} className="glass-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPedido(pedido)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusInfo.color}`}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">#{pedido.numero_pedido}</span>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{pedido.cliente_nome} · {pedido.cliente_telefone || pedido.cliente_email || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatCurrency(pedido.valor_total)}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(pedido.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</p>
                  </div>
                  <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedPedido} onOpenChange={() => setSelectedPedido(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedPedido && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido #{selectedPedido.numero_pedido}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{selectedPedido.cliente_nome}</p>
                  {selectedPedido.cliente_email && <p className="text-sm text-muted-foreground">{selectedPedido.cliente_email}</p>}
                  {selectedPedido.cliente_telefone && <p className="text-sm text-muted-foreground">{selectedPedido.cliente_telefone}</p>}
                </div>
                {selectedPedido.endereco && (
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="text-sm text-foreground">
                      {selectedPedido.endereco.rua}, {selectedPedido.endereco.numero}
                      {selectedPedido.endereco.complemento && ` - ${selectedPedido.endereco.complemento}`}<br />
                      {selectedPedido.endereco.bairro} - {selectedPedido.endereco.cidade}/{selectedPedido.endereco.estado}<br />
                      CEP: {selectedPedido.endereco.cep}
                    </p>
                  </div>
                )}
                <Separator />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Itens</p>
                  {pedidoItens.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-foreground">{item.pecas?.nome || 'Peça'} x{item.quantidade}</span>
                      <span className="text-foreground">{formatCurrency(item.preco_unitario * item.quantidade)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(selectedPedido.valor_subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete</span><span>{formatCurrency(selectedPedido.valor_frete)}</span></div>
                  <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(selectedPedido.valor_total)}</span></div>
                </div>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground">Atualizar Status</Label>
                  <Select value={selectedPedido.status} onValueChange={(v) => { updateStatus.mutate({ id: selectedPedido.id, status: v }); setSelectedPedido({ ...selectedPedido, status: v }); }}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
