import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, TrendingUp, DollarSign, Users, Package, 
  ArrowUpRight, ArrowDownRight, Eye, Star, BarChart3, Loader2
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function EcommerceDashboard() {
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['ecommerce-dashboard-pedidos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ecommerce_pedidos' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      return (data as any[]) || [];
    },
  });

  const { data: avaliacoes = [] } = useQuery({
    queryKey: ['ecommerce-dashboard-avaliacoes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ecommerce_avaliacoes' as any)
        .select('nota, created_at')
        .limit(200);
      return (data as any[]) || [];
    },
  });

  const stats = useMemo(() => {
    const today = new Date();
    const last30 = subDays(today, 30);
    const last60 = subDays(today, 60);

    const recent = pedidos.filter((p: any) => new Date(p.created_at) >= last30);
    const previous = pedidos.filter((p: any) => {
      const d = new Date(p.created_at);
      return d >= last60 && d < last30;
    });

    const recentRevenue = recent.filter((p: any) => p.status !== 'cancelado').reduce((s: number, p: any) => s + (p.valor_total || 0), 0);
    const prevRevenue = previous.filter((p: any) => p.status !== 'cancelado').reduce((s: number, p: any) => s + (p.valor_total || 0), 0);
    const revenueChange = prevRevenue > 0 ? ((recentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const todayOrders = pedidos.filter((p: any) => isToday(new Date(p.created_at)));
    const todayRevenue = todayOrders.filter((p: any) => p.status !== 'cancelado').reduce((s: number, p: any) => s + (p.valor_total || 0), 0);

    const uniqueClients = new Set(recent.map((p: any) => p.cliente_email || p.cliente_telefone).filter(Boolean));
    const avgTicket = recent.length > 0 ? recentRevenue / recent.filter((p: any) => p.status !== 'cancelado').length : 0;

    const avgRating = avaliacoes.length > 0 ? avaliacoes.reduce((s: number, a: any) => s + a.nota, 0) / avaliacoes.length : 0;

    return { recentRevenue, revenueChange, todayOrders: todayOrders.length, todayRevenue, uniqueClients: uniqueClients.size, avgTicket, avgRating, totalOrders: recent.length };
  }, [pedidos, avaliacoes]);

  // Chart data - last 7 days
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStr = format(date, 'dd/MM');
      const dayPedidos = pedidos.filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= startOfDay(date) && d <= endOfDay(date) && p.status !== 'cancelado';
      });
      return {
        name: dayStr,
        vendas: dayPedidos.reduce((s: number, p: any) => s + (p.valor_total || 0), 0),
        pedidos: dayPedidos.length,
      };
    });
    return days;
  }, [pedidos]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    pedidos.forEach((p: any) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [pedidos]);

  // Recent orders
  const recentOrders = pedidos.slice(0, 5);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  const STATUS_LABELS: Record<string, string> = { pendente: 'Pendente', pago: 'Pago', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado' };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              {stats.revenueChange !== 0 && (
                <Badge variant="secondary" className={stats.revenueChange > 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-destructive bg-destructive/10'}>
                  {stats.revenueChange > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {Math.abs(stats.revenueChange).toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.recentRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Faturamento 30 dias</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center mb-2">
              <ShoppingBag className="w-5 h-5 text-chart-2" />
            </div>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pedidos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-chart-3" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.avgTicket)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ticket Médio</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-chart-4" />
            </div>
            <p className="text-2xl font-bold">{stats.uniqueClients}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Clientes únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Today summary */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 via-transparent to-chart-2/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Hoje</p>
                <p className="text-lg font-bold">{stats.todayOrders} pedidos · {formatCurrency(stats.todayRevenue)}</p>
              </div>
            </div>
            {stats.avgRating > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold">{stats.avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({avaliacoes.length} avaliações)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Vendas - Últimos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="vendaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v/100).toFixed(0)}${v >= 100 ? '' : ''}`} />
                <Tooltip 
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                />
                <Area type="monotone" dataKey="vendas" stroke="hsl(var(--primary))" fill="url(#vendaGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Status dos Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [value, STATUS_LABELS[name] || name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {statusData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-muted-foreground">{STATUS_LABELS[s.name] || s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Pedidos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum pedido ainda</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">#{p.numero_pedido}</span>
                      <Badge variant="outline" className="text-[10px]">{STATUS_LABELS[p.status] || p.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.cliente_nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(p.valor_total)}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(p.created_at), 'dd/MM HH:mm', { locale: ptBR })}</p>
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
