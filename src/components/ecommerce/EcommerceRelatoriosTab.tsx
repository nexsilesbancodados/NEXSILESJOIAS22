import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganization } from '@/hooks/useOrganization';
import { db } from '@/lib/supabase-db';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Percent, Calendar, FileText } from 'lucide-react';

export function EcommerceRelatoriosTab() {
  const { organization } = useOrganization();
  const [periodo, setPeriodo] = useState('30d');

  const getDateRange = () => {
    const now = new Date();
    switch (periodo) {
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case '90d': return { start: subDays(now, 90), end: now };
      case 'mes': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'mes_anterior': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      default: return { start: subDays(now, 30), end: now };
    }
  };

  const { data: pedidos = [] } = useQuery({
    queryKey: ['ecommerce-relatorios', organization?.id, periodo],
    queryFn: async () => {
      if (!organization?.id) return [];
      const range = getDateRange();
      const { data } = await db.from('ecommerce_pedidos')
        .select('*, ecommerce_pedido_itens(*, pecas(nome, categoria, preco_venda))')
        .eq('organization_id', organization.id)
        .gte('created_at', range.start.toISOString())
        .lte('created_at', range.end.toISOString())
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const stats = {
    totalVendas: pedidos.filter((p: any) => p.status !== 'cancelado').reduce((s: number, p: any) => s + (p.valor_total || 0), 0),
    totalPedidos: pedidos.filter((p: any) => p.status !== 'cancelado').length,
    ticketMedio: 0,
    taxaConversao: 0,
    pedidosCancelados: pedidos.filter((p: any) => p.status === 'cancelado').length,
    pedidosPendentes: pedidos.filter((p: any) => p.status === 'pendente').length,
  };
  stats.ticketMedio = stats.totalPedidos > 0 ? stats.totalVendas / stats.totalPedidos : 0;
  stats.taxaConversao = pedidos.length > 0 ? ((stats.totalPedidos / pedidos.length) * 100) : 0;

  // Vendas por dia
  const vendasPorDia = pedidos
    .filter((p: any) => p.status !== 'cancelado')
    .reduce((acc: any, p: any) => {
      const dia = format(new Date(p.created_at), 'dd/MM');
      acc[dia] = (acc[dia] || 0) + (p.valor_total || 0);
      return acc;
    }, {});
  const chartVendasDia = Object.entries(vendasPorDia).map(([dia, valor]) => ({ dia, valor }));

  // Vendas por categoria
  const vendasPorCategoria: Record<string, number> = {};
  pedidos.filter((p: any) => p.status !== 'cancelado').forEach((p: any) => {
    (p.ecommerce_pedido_itens || []).forEach((item: any) => {
      const cat = item.pecas?.categoria || 'Sem categoria';
      vendasPorCategoria[cat] = (vendasPorCategoria[cat] || 0) + (item.preco_unitario * item.quantidade);
    });
  });
  const chartCategorias = Object.entries(vendasPorCategoria).map(([name, value]) => ({ name, value }));
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

  // Status dos pedidos
  const statusCount: Record<string, number> = {};
  pedidos.forEach((p: any) => {
    statusCount[p.status] = (statusCount[p.status] || 0) + 1;
  });
  const chartStatus = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  // Top produtos
  const produtoVendas: Record<string, { nome: string; qtd: number; valor: number }> = {};
  pedidos.filter((p: any) => p.status !== 'cancelado').forEach((p: any) => {
    (p.ecommerce_pedido_itens || []).forEach((item: any) => {
      const nome = item.pecas?.nome || 'Desconhecido';
      if (!produtoVendas[nome]) produtoVendas[nome] = { nome, qtd: 0, valor: 0 };
      produtoVendas[nome].qtd += item.quantidade;
      produtoVendas[nome].valor += item.preco_unitario * item.quantidade;
    });
  });
  const topProdutos = Object.values(produtoVendas).sort((a, b) => b.valor - a.valor).slice(0, 10);

  // Métodos de pagamento
  const metodoCount: Record<string, number> = {};
  pedidos.filter((p: any) => p.status !== 'cancelado').forEach((p: any) => {
    const metodo = p.metodo_pagamento || 'Não informado';
    metodoCount[metodo] = (metodoCount[metodo] || 0) + 1;
  });
  const chartMetodos = Object.entries(metodoCount).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Filtro período */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="mes">Este mês</SelectItem>
              <SelectItem value="mes_anterior">Mês anterior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="h-3.5 w-3.5" />Faturamento</div>
          <p className="text-2xl font-bold">R$ {stats.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><ShoppingCart className="h-3.5 w-3.5" />Pedidos</div>
          <p className="text-2xl font-bold">{stats.totalPedidos}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" />Ticket Médio</div>
          <p className="text-2xl font-bold">R$ {stats.ticketMedio.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Package className="h-3.5 w-3.5" />Pendentes</div>
          <p className="text-2xl font-bold">{stats.pedidosPendentes}</p>
          <p className="text-xs text-muted-foreground">{stats.pedidosCancelados} cancelados</p>
        </CardContent></Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Vendas por Dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartVendasDia}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Area type="monotone" dataKey="valor" fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Vendas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {chartCategorias.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={chartCategorias} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {chartCategorias.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top produtos */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Top 10 Produtos</CardTitle></CardHeader>
          <CardContent>
            {topProdutos.length > 0 ? (
              <div className="space-y-2">
                {topProdutos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs w-6 justify-center">{i + 1}</Badge>
                      <span className="truncate">{p.nome}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{p.qtd} un</span>
                      <span className="font-medium text-foreground">R$ {p.valor.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Métodos de pagamento */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Métodos de Pagamento</CardTitle></CardHeader>
          <CardContent>
            {chartMetodos.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartMetodos}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status dos pedidos */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Distribuição por Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {chartStatus.map((s) => (
              <Badge key={s.name} variant="secondary" className="text-sm px-3 py-1.5">
                {s.name}: <span className="font-bold ml-1">{s.value}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
