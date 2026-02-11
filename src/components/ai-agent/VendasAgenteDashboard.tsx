import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, TrendingUp, Users, Target, 
  DollarSign, Flame, Thermometer, Snowflake,
  BarChart3, ArrowUpRight, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LEAD_COLORS: Record<string, string> = {
  quente: '#ef4444',
  morno: '#f59e0b',
  frio: '#3b82f6',
};

const LEAD_ICONS: Record<string, typeof Flame> = {
  quente: Flame,
  morno: Thermometer,
  frio: Snowflake,
};

export function VendasAgenteDashboard() {
  const { organizationId } = useOrganization();
  const [periodo, setPeriodo] = useState(30);

  const { data: conversas = [] } = useQuery({
    queryKey: ['agent-sales-dashboard', organizationId, periodo],
    queryFn: async () => {
      if (!organizationId) return [];
      const desde = subDays(new Date(), periodo).toISOString();
      const { data } = await (supabase as any)
        .from('agente_conversas')
        .select('id, created_at, lead_score, venda_realizada, valor_venda, status, total_mensagens, sentimento, follow_up_enviado, produtos_interesse, ultimo_contato_at')
        .eq('organization_id', organizationId)
        .gte('created_at', desde)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organizationId,
  });

  const stats = useMemo(() => {
    const total = conversas.length;
    const vendasRealizadas = conversas.filter((c: any) => c.venda_realizada);
    const totalVendas = vendasRealizadas.length;
    const receitaTotal = vendasRealizadas.reduce((acc: number, c: any) => acc + (c.valor_venda || 0), 0);
    const taxaConversao = total > 0 ? (totalVendas / total) * 100 : 0;
    const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0;

    const leads = {
      quente: conversas.filter((c: any) => c.lead_score === 'quente').length,
      morno: conversas.filter((c: any) => c.lead_score === 'morno').length,
      frio: conversas.filter((c: any) => c.lead_score === 'frio').length,
    };

    const followUpsPendentes = conversas.filter(
      (c: any) => !c.follow_up_enviado && !c.venda_realizada && c.status === 'ativa'
    ).length;

    return { total, totalVendas, receitaTotal, taxaConversao, ticketMedio, leads, followUpsPendentes };
  }, [conversas]);

  const chartData = useMemo(() => {
    const days = Math.min(periodo, 30);
    const data: { date: string; conversas: number; vendas: number; receita: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayConversas = conversas.filter((c: any) => c.created_at?.startsWith(dayStr));
      
      data.push({
        date: format(day, 'dd/MM', { locale: ptBR }),
        conversas: dayConversas.length,
        vendas: dayConversas.filter((c: any) => c.venda_realizada).length,
        receita: dayConversas.filter((c: any) => c.venda_realizada).reduce((a: number, c: any) => a + (c.valor_venda || 0), 0),
      });
    }
    return data;
  }, [conversas, periodo]);

  const leadPieData = useMemo(() => {
    return [
      { name: 'Quente', value: stats.leads.quente, fill: LEAD_COLORS.quente },
      { name: 'Morno', value: stats.leads.morno, fill: LEAD_COLORS.morno },
      { name: 'Frio', value: stats.leads.frio, fill: LEAD_COLORS.frio },
    ].filter(d => d.value > 0);
  }, [stats.leads]);

  const funnelData = useMemo(() => {
    return [
      { name: 'Conversas', value: stats.total },
      { name: 'Leads Mornos+', value: stats.leads.quente + stats.leads.morno },
      { name: 'Leads Quentes', value: stats.leads.quente },
      { name: 'Vendas', value: stats.totalVendas },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {[7, 15, 30].map(d => (
          <button
            key={d}
            onClick={() => setPeriodo(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              periodo === d
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalVendas}</p>
                <p className="text-xs text-muted-foreground">Vendas pelo Bot</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {stats.receitaTotal.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Receita do Agente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Target className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.taxaConversao.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ArrowUpRight className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {stats.ticketMedio.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Vendas & Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [
                    name === 'receita' ? `R$ ${value.toFixed(2)}` : value,
                    name === 'receita' ? 'Receita' : name === 'vendas' ? 'Vendas' : 'Conversas'
                  ]}
                />
                <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="url(#colorReceita)" strokeWidth={2} />
                <Area type="monotone" dataKey="vendas" stroke="#22c55e" fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead qualification pie */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Qualificação de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={leadPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {leadPieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {Object.entries(stats.leads).map(([key, val]) => {
                    const Icon = LEAD_ICONS[key];
                    return (
                      <div key={key} className="flex items-center gap-1.5 text-sm">
                        <Icon className="h-3.5 w-3.5" style={{ color: LEAD_COLORS[key] }} />
                        <span className="capitalize">{key}</span>
                        <Badge variant="secondary" className="text-xs px-1.5">{val}</Badge>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Sem dados de leads
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Follow-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={funnelData} layout="vertical">
                <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Follow-ups Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-amber-500">{stats.followUpsPendentes}</p>
              <p className="text-sm text-muted-foreground mt-2">conversas sem follow-up</p>
              <p className="text-xs text-muted-foreground mt-1">
                O agente enviará follow-up automaticamente para leads quentes e mornos
              </p>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Total de conversas</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Com venda realizada</span>
                <span className="font-medium text-green-500">{stats.totalVendas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Follow-ups enviados</span>
                <span className="font-medium">{conversas.filter((c: any) => c.follow_up_enviado).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
