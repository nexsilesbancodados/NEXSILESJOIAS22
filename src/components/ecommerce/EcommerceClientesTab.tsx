import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOrganization } from '@/hooks/useOrganization';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, Search, Loader2, Mail, Phone, ShoppingBag, 
  Eye, DollarSign, Calendar, TrendingUp, UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function EcommerceClientesTab() {
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const { organizationId } = useOrganization();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['ecommerce-clientes-pedidos', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('ecommerce_pedidos' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!organizationId,
  });

  // Aggregate clients from orders
  const clientes = (() => {
    const map = new Map<string, any>();
    pedidos.forEach((p: any) => {
      const key = (p.cliente_email || p.cliente_telefone || p.cliente_nome).toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          key,
          nome: p.cliente_nome,
          email: p.cliente_email,
          telefone: p.cliente_telefone,
          totalPedidos: 0,
          totalGasto: 0,
          ultimoPedido: p.created_at,
          pedidos: [],
        });
      }
      const c = map.get(key)!;
      c.totalPedidos++;
      if (p.status !== 'cancelado') c.totalGasto += (p.valor_total || 0);
      c.pedidos.push(p);
      if (new Date(p.created_at) > new Date(c.ultimoPedido)) c.ultimoPedido = p.created_at;
    });
    return Array.from(map.values()).sort((a, b) => b.totalGasto - a.totalGasto);
  })();

  const filtered = clientes.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.nome?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.telefone?.includes(q);
  });

  const totalClientes = clientes.length;
  const recorrentes = clientes.filter(c => c.totalPedidos > 1).length;
  const ltvMedio = totalClientes > 0 ? clientes.reduce((s, c) => s + c.totalGasto, 0) / totalClientes : 0;

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const STATUS_LABELS: Record<string, string> = { pendente: 'Pendente', pago: 'Pago', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado' };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalClientes}</p>
            <p className="text-xs text-muted-foreground">Total de clientes</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center mb-2">
              <UserCheck className="w-5 h-5 text-chart-2" />
            </div>
            <p className="text-2xl font-bold">{recorrentes}</p>
            <p className="text-xs text-muted-foreground">Recorrentes</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-chart-3" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(ltvMedio)}</p>
            <p className="text-xs text-muted-foreground">LTV Médio</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.key} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCliente(c)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{c.nome?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.nome}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {c.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{c.email}</span>}
                    {c.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefone}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold">{formatCurrency(c.totalGasto)}</p>
                  <p className="text-[10px] text-muted-foreground">{c.totalPedidos} pedido{c.totalPedidos > 1 ? 's' : ''}</p>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0"><Eye className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Client detail dialog */}
      <Dialog open={!!selectedCliente} onOpenChange={() => setSelectedCliente(null)}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          {selectedCliente && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary">{selectedCliente.nome?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p>{selectedCliente.nome}</p>
                    <p className="text-xs text-muted-foreground font-normal">{selectedCliente.email || selectedCliente.telefone}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{selectedCliente.totalPedidos}</p>
                  <p className="text-[10px] text-muted-foreground">Pedidos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{formatCurrency(selectedCliente.totalGasto)}</p>
                  <p className="text-[10px] text-muted-foreground">Total gasto</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{formatCurrency(selectedCliente.totalGasto / selectedCliente.totalPedidos)}</p>
                  <p className="text-[10px] text-muted-foreground">Ticket médio</p>
                </div>
              </div>

              <Separator />

              <ScrollArea className="max-h-[40vh]">
                <div className="space-y-2 py-2">
                  <p className="text-sm font-medium">Histórico de Pedidos</p>
                  {selectedCliente.pedidos.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <ShoppingBag className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{p.numero_pedido}</span>
                          <Badge variant="outline" className="text-[10px]">{STATUS_LABELS[p.status] || p.status}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                      <span className="text-sm font-bold">{formatCurrency(p.valor_total)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
