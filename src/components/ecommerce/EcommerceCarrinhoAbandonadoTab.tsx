import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageSquare, Mail, TrendingUp, Clock, DollarSign, AlertCircle } from 'lucide-react';

export function EcommerceCarrinhoAbandonadoTab() {
  // Placeholder - futuramente integrado com tracking real
  const mockData = {
    totalAbandonados: 47,
    valorPerdido: 8450.00,
    taxaAbandono: 68,
    recuperados: 12,
    valorRecuperado: 2100.00,
  };

  const abandonos = [
    { id: 1, cliente: 'Maria Silva', email: 'maria@email.com', telefone: '11999001122', itens: 3, valor: 450.00, tempo: '2h atrás', status: 'pendente' },
    { id: 2, cliente: 'João Santos', email: 'joao@email.com', telefone: '11998877665', itens: 1, valor: 189.90, tempo: '5h atrás', status: 'notificado' },
    { id: 3, cliente: 'Ana Costa', email: 'ana@email.com', telefone: '11997766544', itens: 5, valor: 1250.00, tempo: '1 dia atrás', status: 'pendente' },
    { id: 4, cliente: 'Pedro Lima', email: null, telefone: '11996655433', itens: 2, valor: 320.00, tempo: '2 dias atrás', status: 'recuperado' },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><ShoppingCart className="h-3.5 w-3.5" />Abandonados</div>
          <p className="text-2xl font-bold">{mockData.totalAbandonados}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="h-3.5 w-3.5" />Valor Perdido</div>
          <p className="text-2xl font-bold text-destructive">R$ {mockData.valorPerdido.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><AlertCircle className="h-3.5 w-3.5" />Taxa Abandono</div>
          <p className="text-2xl font-bold">{mockData.taxaAbandono}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" />Recuperados</div>
          <p className="text-2xl font-bold text-emerald-500">{mockData.recuperados}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="h-3.5 w-3.5" />Valor Recuperado</div>
          <p className="text-2xl font-bold text-emerald-500">R$ {mockData.valorRecuperado.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      {/* Info banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Recuperação de Carrinho</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure automações para enviar mensagens WhatsApp ou e-mail para clientes que abandonaram o carrinho. 
              Ofereça cupons de desconto para incentivar a finalização da compra.
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
          <div className="space-y-3">
            {abandonos.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.cliente}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{item.tempo}</span>
                    <span>•</span>
                    <span>{item.itens} {item.itens === 1 ? 'item' : 'itens'}</span>
                  </div>
                </div>
                <p className="text-sm font-bold">R$ {item.valor.toFixed(2)}</p>
                <Badge variant={item.status === 'recuperado' ? 'default' : item.status === 'notificado' ? 'secondary' : 'outline'} className="text-xs">
                  {item.status === 'recuperado' ? '✅ Recuperado' : item.status === 'notificado' ? '📩 Notificado' : '⏳ Pendente'}
                </Badge>
                {item.status !== 'recuperado' && (
                  <div className="flex gap-1">
                    {item.telefone && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {item.email && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
