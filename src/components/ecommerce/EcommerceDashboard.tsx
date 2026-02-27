import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, TrendingUp, DollarSign, Users, Package, 
  ArrowUpRight, ArrowDownRight, Eye, Star, BarChart3, Loader2,
  Clock, CreditCard, Truck, RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';

const STATUS_LABELS: Record<string, string> = { pendente: 'Pendente', pago: 'Pago', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado' };
const STATUS_COLORS: Record<string, string> = { pendente: 'text-amber-500', pago: 'text-primary', enviado: 'text-blue-500', entregue: 'text-emerald-500', cancelado: 'text-destructive' };

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

export function EcommerceDashboard() {
  const { organization } = useOrganization();

  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ['ecommerce-dashboard-pedidos', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await db
        .from('ecommerce_pedidos')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: avaliacoes = [] } = useQuery({
    queryKey: ['ecommerce-dashboard-avaliacoes', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await db
        .from('ecommerce_avaliacoes')
        .select('nota, created_at')
        .eq('organization_id', organization.id)
        .limit(200);
      return data || [];
    },
    enabled: !!organization?.id,
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

    const recentValid = recent.filter((p: any) => p.status !== 'cancelado');
    const prevValid = previous.filter((p: any) => p.status !== 'cancelado');
    const recentRevenue = recentValid.reduce((s: number, p: any) => s + (p.valor_total || 0), 0);
    const prevRevenue = prevValid.reduce((s: number, p: any) => s + (p.valor_total || 0), 0);
    const revenueChange = prevRevenue > 0 ? ((recentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const ordersChange = prevValid.length > 0 ? ((recentValid.length - prevValid.length) / prevValid.length) * 100 : 0;

    const todayOrders = pedidos.filter((p: any) => isToday(new Date(p.created_at)));
    const yesterdayOrders = pedidos.filter((p: any) => isYesterday(new Date(p.created_at)));
    const todayRevenue = todayOrders.filter((p: any) => p.status !== 'cancelado').reduce((s: number, p: any) => s + (p.valor_total || 0), 0);
    const yesterdayRevenue = yesterdayOrders.filter((p: any) => p.status !== 'cancelado').reduce((s: number, p: any) => s + (p.valor_total || 0), 0);

    const uniqueClients = new Set(recent.map((p: any) => p.cliente_email || p.cliente_telefone).filter(Boolean));
    const avgTicket = recentValid.length > 0 ? recentRevenue / recentValid.length : 0;
    const avgRating = avaliacoes.length > 0 ? avaliacoes.reduce((s: number, a: any) => s + a.nota, 0) / avaliacoes.length : 0;

    const pendentes = pedidos.filter((p: any) => p.status === 'pendente').length;
    const enviados = pedidos.filter((p: any) => p.status === 'enviado').length;

    return { recentRevenue, revenueChange, ordersChange, todayOrders: todayOrders.length, todayRevenue, yesterdayRevenue, uniqueClients: uniqueClients.size, avgTicket, avgRating, totalOrders: recentValid.length, pendentes, enviados };
  }, [pedidos, avaliacoes]);

  // Chart data - last 14 days
  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dayPedidos = pedidos.filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= startOfDay(date) && d <= endOfDay(date) && p.status !== 'cancelado';
      });
      return {
        name: format(date, 'dd/MM'),
        vendas: dayPedidos.reduce((s: number, p: any) => s + (p.valor_total || 0), 0),
        pedidos: dayPedidos.length,
      };
    });
  }, [pedidos]);

  // Hourly distribution for today
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hora: `${h}h`,
      pedidos: pedidos.filter((p: any) => {
        const d = new Date(p.created_at);
        return isToday(d) && d.getHours() === h;
      }).length,
    }));
    return hours.filter(h => h.pedidos > 0 || [9,10,11,12,13,14,15,16,17,18,19,20].includes(parseInt(h.hora)));
  }, [pedidos]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    pedidos.forEach((p: any) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [pedidos]);

  const recentOrders = pedidos.slice(0, 6);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { 
            icon: DollarSign, label: 'Faturamento 30d', value: formatCurrency(stats.recentRevenue),
            change: stats.revenueChange, gradient: 'from-primary/8 to-primary/3', iconBg: 'bg-primary/10', iconColor: 'text-primary'
          },
          { 
            icon: ShoppingBag, label: 'Pedidos 30d', value: stats.totalOrders.toString(),
            change: stats.ordersChange, gradient: 'from-chart-2/8 to-chart-2/3', iconBg: 'bg-chart-2/10', iconColor: 'text-chart-2'
          },
          { 
            icon: TrendingUp, label: 'Ticket Médio', value: formatCurrency(stats.avgTicket),
            gradient: 'from-chart-3/8 to-chart-3/3', iconBg: 'bg-chart-3/10', iconColor: 'text-chart-3'
          },
          { 
            icon: Users, label: 'Clientes únicos', value: stats.uniqueClients.toString(),
            gradient: 'from-chart-4/8 to-chart-4/3', iconBg: 'bg-chart-4/10', iconColor: 'text-chart-4'
          },
        ].map((kpi, i) => (
          <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-sm bg-gradient-to-br overflow-hidden relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient}`} />
              <CardContent className="pt-4 pb-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
                  </div>
                  {kpi.change !== undefined && kpi.change !== 0 && (
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0.5 ${kpi.change > 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-destructive bg-destructive/10'}`}>
                      {kpi.change > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                      {Math.abs(kpi.change).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <p className="text-xl md:text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today summary + Quick stats */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-border/50">
              <div className="p-4 col-span-2 md:col-span-1 bg-gradient-to-br from-primary/5 to-transparent">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Hoje</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-xs text-muted-foreground">{stats.todayOrders} pedido{stats.todayOrders !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-4 hidden md:block">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ontem</p>
                <p className="text-lg font-bold mt-1">{formatCurrency(stats.yesterdayRevenue)}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendentes</p>
                </div>
                <p className="text-lg font-bold mt-1 text-amber-500">{stats.pendentes}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-blue-500" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Enviados</p>
                </div>
                <p className="text-lg font-bold mt-1 text-blue-500">{stats.enviados}</p>
              </div>
              <div className="p-4 hidden md:block">
                {stats.avgRating > 0 ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avaliação</p>
                    </div>
                    <p className="text-lg font-bold mt-1">{stats.avgRating.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">{avaliacoes.length} avaliações</p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avaliações</p>
                    <p className="text-lg font-bold mt-1 text-muted-foreground">—</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div className="lg:col-span-2" {...fadeIn} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Vendas — Últimos 14 dias
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="vendaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip 
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                  />
                  <Area type="monotone" dataKey="vendas" stroke="hsl(var(--primary))" fill="url(#vendaGradient)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Status dos Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {statusData.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Sem dados</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3} strokeWidth={0}>
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value, STATUS_LABELS[name] || name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center">
                    {statusData.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground">{STATUS_LABELS[s.name] || s.name} ({s.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hourly distribution + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {hourlyData.length > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Pedidos por Hora (Hoje)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="hora" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Pedidos Recentes
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">{pedidos.length} total</Badge>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentOrders.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold">#{p.numero_pedido}</span>
                          <span className={`text-[10px] font-medium ${STATUS_COLORS[p.status] || 'text-muted-foreground'}`}>
                            {STATUS_LABELS[p.status] || p.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{p.cliente_nome}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold">{formatCurrency(p.valor_total)}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(p.created_at), 'dd/MM HH:mm', { locale: ptBR })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
