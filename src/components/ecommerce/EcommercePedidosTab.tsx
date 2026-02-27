import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Package, ShoppingBag, Loader2, Eye, Search, DollarSign, Clock, Truck, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  pago: { label: 'Pago', icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10' },
  enviado: { label: 'Enviado', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  entregue: { label: 'Entregue', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

const formatCurrency = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function EcommercePedidosTab() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<any>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['ecommerce-pedidos', organization?.id, statusFilter],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = db
        .from('ecommerce_pedidos')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (statusFilter !== 'todos') query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: pedidoItens = [] } = useQuery({
    queryKey: ['ecommerce-pedido-itens', selectedPedido?.id],
    queryFn: async () => {
      if (!selectedPedido) return [];
      const { data } = await db
        .from('ecommerce_pedido_itens')
        .select('*, pecas:peca_id(nome, codigo, imagem_url)')
        .eq('pedido_id', selectedPedido.id);
      return data || [];
    },
    enabled: !!selectedPedido,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db.from('ecommerce_pedidos').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedidos'] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const filtered = pedidos.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.cliente_nome?.toLowerCase().includes(q) || 
           String(p.numero_pedido).includes(q) ||
           p.cliente_email?.toLowerCase().includes(q) ||
           p.cliente_telefone?.includes(q);
  });

  const totalVendas = pedidos.filter((p: any) => p.status !== 'cancelado').reduce((sum: number, p: any) => sum + (p.valor_total || 0), 0);
  const statusCounts = Object.keys(STATUS_MAP).reduce((acc, k) => ({ ...acc, [k]: pedidos.filter((p: any) => p.status === k).length }), {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
              <ShoppingBag className="h-3.5 w-3.5" />Total Pedidos
            </div>
            <p className="text-2xl font-bold">{pedidos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
              <DollarSign className="h-3.5 w-3.5" />Faturamento
            </div>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalVendas)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
              <Clock className="h-3.5 w-3.5" />Pendentes
            </div>
            <p className="text-2xl font-bold text-amber-500">{statusCounts.pendente || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
              <Truck className="h-3.5 w-3.5" />Enviados
            </div>
            <p className="text-2xl font-bold text-blue-500">{statusCounts.enviado || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, nº pedido, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button size="sm" variant={statusFilter === 'todos' ? 'default' : 'outline'} onClick={() => setStatusFilter('todos')} className="text-xs">
            Todos ({pedidos.length})
          </Button>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <Button key={k} size="sm" variant={statusFilter === k ? 'default' : 'outline'} onClick={() => setStatusFilter(k)} className="text-xs gap-1">
              {v.label} {statusCounts[k] > 0 && <span className="opacity-70">({statusCounts[k]})</span>}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{search ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((pedido: any, i: number) => {
            const statusInfo = STATUS_MAP[pedido.status] || STATUS_MAP.pendente;
            const StatusIcon = statusInfo.icon;
            return (
              <motion.div key={pedido.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelectedPedido(pedido)}>
                  <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", statusInfo.bg)}>
                      <StatusIcon className={cn("w-4 h-4", statusInfo.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">#{pedido.numero_pedido}</span>
                        <Badge className={cn("text-[10px] border-0", statusInfo.bg, statusInfo.color)}>{statusInfo.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{pedido.cliente_nome} · {pedido.cliente_telefone || pedido.cliente_email || '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm">{formatCurrency(pedido.valor_total)}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(pedido.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</p>
                    </div>
                    <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedPedido} onOpenChange={() => setSelectedPedido(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedPedido && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", STATUS_MAP[selectedPedido.status]?.bg)}>
                    <ShoppingBag className={cn("w-4 h-4", STATUS_MAP[selectedPedido.status]?.color)} />
                  </div>
                  Pedido #{selectedPedido.numero_pedido}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Cliente</p>
                    <p className="text-sm font-medium mt-0.5">{selectedPedido.cliente_nome}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Data</p>
                    <p className="text-sm font-medium mt-0.5">{format(new Date(selectedPedido.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</p>
                  </div>
                </div>
                {selectedPedido.cliente_email && <p className="text-xs text-muted-foreground">📧 {selectedPedido.cliente_email}</p>}
                {selectedPedido.cliente_telefone && <p className="text-xs text-muted-foreground">📱 {selectedPedido.cliente_telefone}</p>}

                {selectedPedido.endereco && (
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Endereço</p>
                    <p className="text-xs">
                      {selectedPedido.endereco.rua}, {selectedPedido.endereco.numero}
                      {selectedPedido.endereco.complemento && ` — ${selectedPedido.endereco.complemento}`}<br />
                      {selectedPedido.endereco.bairro} — {selectedPedido.endereco.cidade}/{selectedPedido.endereco.estado}<br />
                      CEP: {selectedPedido.endereco.cep}
                    </p>
                  </div>
                )}

                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Itens</p>
                  {pedidoItens.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.pecas?.imagem_url && <img src={item.pecas.imagem_url} className="w-7 h-7 rounded object-cover" />}
                        <span className="truncate">{item.pecas?.nome || 'Peça'} <span className="text-muted-foreground">×{item.quantidade}</span></span>
                      </div>
                      <span className="font-medium flex-shrink-0">{formatCurrency(item.preco_unitario * item.quantidade)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(selectedPedido.valor_subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{formatCurrency(selectedPedido.valor_frete)}</span></div>
                  {selectedPedido.valor_desconto > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="text-emerald-500">-{formatCurrency(selectedPedido.valor_desconto)}</span></div>}
                  <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>{formatCurrency(selectedPedido.valor_total)}</span></div>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Atualizar Status</Label>
                  <Select value={selectedPedido.status} onValueChange={(v) => { updateStatus.mutate({ id: selectedPedido.id, status: v }); setSelectedPedido({ ...selectedPedido, status: v }); }}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
