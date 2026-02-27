import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageSquare, Mail, TrendingUp, Clock, DollarSign, AlertCircle, Loader2, Inbox } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { db } from '@/lib/supabase-db';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function EcommerceCarrinhoAbandonadoTab() {
  const { organization } = useOrganization();

  // Buscar pedidos pendentes (não finalizados) como proxy de carrinhos abandonados
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['ecommerce-carrinhos-abandonados', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await db.from('ecommerce_pedidos')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: todosPedidos = [] } = useQuery({
    queryKey: ['ecommerce-todos-pedidos-abandono', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await db.from('ecommerce_pedidos')
        .select('id, status, valor_total')
        .eq('organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const totalAbandonados = pedidos.length;
  const valorPerdido = pedidos.reduce((s: number, p: any) => s + (p.valor_total || 0), 0);
  const totalPedidos = todosPedidos.length;
  const taxaAbandono = totalPedidos > 0 ? Math.round((totalAbandonados / totalPedidos) * 100) : 0;
  const recuperados = todosPedidos.filter((p: any) => p.status === 'pago').length;
  const valorRecuperado = todosPedidos.filter((p: any) => p.status === 'pago').reduce((s: number, p: any) => s + (p.valor_total || 0), 0);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><ShoppingCart className="h-3.5 w-3.5" />Abandonados</div>
          <p className="text-2xl font-bold">{totalAbandonados}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="h-3.5 w-3.5" />Valor Perdido</div>
          <p className="text-2xl font-bold text-destructive">R$ {valorPerdido.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><AlertCircle className="h-3.5 w-3.5" />Taxa Abandono</div>
          <p className="text-2xl font-bold">{taxaAbandono}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" />Recuperados</div>
          <p className="text-2xl font-bold text-emerald-500">{recuperados}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="h-3.5 w-3.5" />Valor Recuperado</div>
          <p className="text-2xl font-bold text-emerald-500">R$ {valorRecuperado.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      {/* Info banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Recuperação de Carrinho</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pedidos com status "pendente" são exibidos aqui como potenciais carrinhos abandonados. 
              Entre em contato com o cliente para incentivar a finalização da compra.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de abandonos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Carrinhos Abandonados Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pedidos.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhum carrinho abandonado no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.cliente_nome}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold">R$ {(item.valor_total || 0).toFixed(2)}</p>
                  <Badge variant="outline" className="text-xs">⏳ Pendente</Badge>
                  <div className="flex gap-1">
                    {item.cliente_telefone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const msg = encodeURIComponent(`Olá ${item.cliente_nome}! Notamos que você tem um pedido pendente. Precisa de ajuda para finalizar?`);
                          window.open(`https://wa.me/${item.cliente_telefone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {item.cliente_email && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          window.open(`mailto:${item.cliente_email}?subject=Seu pedido está esperando!&body=Olá ${item.cliente_nome}, notamos que você tem um pedido pendente. Precisa de ajuda?`);
                        }}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
