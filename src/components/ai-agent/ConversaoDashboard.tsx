import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, TrendingUp, Target, DollarSign,
  Flame, Thermometer, Snowflake, BarChart3,
  ArrowUpRight, Clock, Package, Eye, Zap,
  Users, ArrowDownRight, Percent, Trophy
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LEAD_COLORS: Record<string, string> = {
  quente: '#ef4444',
  morno: '#f59e0b',
  frio: '#3b82f6',
};

const HEATMAP_COLORS = [
  'hsl(var(--muted))',
  'hsl(var(--primary) / 0.15)',
  'hsl(var(--primary) / 0.3)',
  'hsl(var(--primary) / 0.5)',
  'hsl(var(--primary) / 0.7)',
  'hsl(var(--primary) / 0.9)',
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ConversaoDashboard() {
  const { organizationId } = useOrganization();
  const [periodo, setPeriodo] = useState(30);

  const { data: conversas = [] } = useQuery({
    queryKey: ['conversao-dashboard', organizationId, periodo],
    queryFn: async () => {
      if (!organizationId) return [];
      const desde = subDays(new Date(), periodo).toISOString();
      const { data } = await (supabase as any)
        .from('agente_conversas')
        .select('id, created_at, lead_score, venda_realizada, valor_venda, status, total_mensagens, sentimento, follow_up_enviado, produtos_interesse, ultimo_contato_at, cliente_telefone, cliente_nome')
        .eq('organization_id', organizationId)
        .gte('created_at', desde)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organizationId,
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['conversao-mensagens', organizationId, periodo],
    queryFn: async () => {
      if (!organizationId) return [];
      const desde = subDays(new Date(), periodo).toISOString();
      const conversaIds = conversas.slice(0, 200).map((c: any) => c.id);
      if (conversaIds.length === 0) return [];
      const { data } = await (supabase as any)
        .from('agente_mensagens')
        .select('id, conversa_id, role, created_at')
        .in('conversa_id', conversaIds)
        .gte('created_at', desde);
      return data || [];
    },
    enabled: conversas.length > 0,
  });

  const { data: vendas = [] } = useQuery({
    queryKey: ['conversao-vendas', organizationId, periodo],
    queryFn: async () => {
      if (!organizationId) return [];
      const desde = subDays(new Date(), periodo).toISOString();
      const { data } = await (supabase as any)
        .from('vendas')
        .select('id, valor_total, created_at, vendas_pecas(peca_id, quantidade, preco_unitario, subtotal, pecas:peca_id(nome, categoria))')
        .eq('organization_id', organizationId)
        .gte('created_at', desde)
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!organizationId,
  });

  // === KPI Calculations ===
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

    // Conversion rate by lead type
    const conversaoQuente = leads.quente > 0
      ? (conversas.filter((c: any) => c.lead_score === 'quente' && c.venda_realizada).length / leads.quente) * 100
      : 0;
    const conversaoMorno = leads.morno > 0
      ? (conversas.filter((c: any) => c.lead_score === 'morno' && c.venda_realizada).length / leads.morno) * 100
      : 0;

    const followUpsPendentes = conversas.filter(
      (c: any) => !c.follow_up_enviado && !c.venda_realizada && c.status === 'ativa'
    ).length;

    const followUpsEnviados = conversas.filter((c: any) => c.follow_up_enviado).length;
    const followUpsConvertidos = conversas.filter((c: any) => c.follow_up_enviado && c.venda_realizada).length;
    const taxaFollowUp = followUpsEnviados > 0 ? (followUpsConvertidos / followUpsEnviados) * 100 : 0;

    // Average messages per conversion
    const avgMsgsConversao = totalVendas > 0
      ? vendasRealizadas.reduce((acc: number, c: any) => acc + (c.total_mensagens || 0), 0) / totalVendas
      : 0;

    // Unique clients
    const clientesUnicos = new Set(conversas.filter((c: any) => c.cliente_telefone).map((c: any) => c.cliente_telefone)).size;
    const clientesRecorrentes = (() => {
      const phoneCounts = new Map<string, number>();
      conversas.forEach((c: any) => {
        if (c.cliente_telefone) {
          phoneCounts.set(c.cliente_telefone, (phoneCounts.get(c.cliente_telefone) || 0) + 1);
        }
      });
      return Array.from(phoneCounts.values()).filter(v => v > 1).length;
    })();

    return {
      total, totalVendas, receitaTotal, taxaConversao, ticketMedio,
      leads, conversaoQuente, conversaoMorno,
      followUpsPendentes, followUpsEnviados, followUpsConvertidos, taxaFollowUp,
      avgMsgsConversao, clientesUnicos, clientesRecorrentes
    };
  }, [conversas]);

  // === Charts Data ===
  const chartData = useMemo(() => {
    const days = Math.min(periodo, 30);
    const data: { date: string; conversas: number; vendas: number; receita: number; taxa: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayConversas = conversas.filter((c: any) => c.created_at?.startsWith(dayStr));
      const dayVendas = dayConversas.filter((c: any) => c.venda_realizada);
      data.push({
        date: format(day, 'dd/MM', { locale: ptBR }),
        conversas: dayConversas.length,
        vendas: dayVendas.length,
        receita: dayVendas.reduce((a: number, c: any) => a + (c.valor_venda || 0), 0),
        taxa: dayConversas.length > 0 ? (dayVendas.length / dayConversas.length) * 100 : 0,
      });
    }
    return data;
  }, [conversas, periodo]);

  // Heatmap: day of week x hour
  const heatmapData = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    conversas.forEach((c: any) => {
      if (!c.created_at) return;
      const d = new Date(c.created_at);
      grid[d.getDay()][d.getHours()]++;
    });
    const maxVal = Math.max(1, ...grid.flat());
    return { grid, maxVal };
  }, [conversas]);

  // Top products from vendas
  const topProducts = useMemo(() => {
    const productMap = new Map<string, { nome: string; categoria: string; qtd: number; receita: number }>();
    vendas.forEach((v: any) => {
      (v.vendas_pecas || []).forEach((vp: any) => {
        const nome = vp.pecas?.nome || 'Produto';
        const cat = vp.pecas?.categoria || '';
        const existing = productMap.get(vp.peca_id) || { nome, categoria: cat, qtd: 0, receita: 0 };
        existing.qtd += vp.quantidade || 1;
        existing.receita += vp.subtotal || 0;
        productMap.set(vp.peca_id, existing);
      });
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 8);
  }, [vendas]);

  // Funnel
  const funnelData = useMemo(() => [
    { name: 'Conversas', value: stats.total, fill: 'hsl(var(--muted-foreground))' },
    { name: 'Leads Mornos+', value: stats.leads.quente + stats.leads.morno, fill: LEAD_COLORS.morno },
    { name: 'Leads Quentes', value: stats.leads.quente, fill: LEAD_COLORS.quente },
    { name: 'Vendas', value: stats.totalVendas, fill: 'hsl(var(--primary))' },
  ], [stats]);

  const getHeatmapColor = (val: number, maxVal: number) => {
    if (val === 0) return HEATMAP_COLORS[0];
    const idx = Math.min(Math.ceil((val / maxVal) * 5), 5);
    return HEATMAP_COLORS[idx];
  };

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[7, 15, 30, 60].map(d => (
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
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard icon={ShoppingCart} label="Vendas" value={stats.totalVendas} color="text-primary" />
        <KPICard icon={DollarSign} label="Receita" value={`R$ ${stats.receitaTotal.toFixed(0)}`} color="text-green-500" />
        <KPICard icon={Target} label="Conversão" value={`${stats.taxaConversao.toFixed(1)}%`} color="text-amber-500" />
        <KPICard icon={ArrowUpRight} label="Ticket Médio" value={`R$ ${stats.ticketMedio.toFixed(0)}`} color="text-purple-500" />
        <KPICard icon={Users} label="Clientes Únicos" value={stats.clientesUnicos} color="text-blue-500" />
        <KPICard icon={Zap} label="Recorrentes" value={stats.clientesRecorrentes} color="text-rose-500" />
      </div>

      {/* Revenue + Conversion Rate chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Receita & Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceita2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [
                    name === 'receita' ? `R$ ${value.toFixed(2)}` : name === 'taxa' ? `${value.toFixed(1)}%` : value,
                    name === 'receita' ? 'Receita' : name === 'taxa' ? 'Taxa Conversão' : 'Vendas'
                  ]}
                />
                <Area yAxisId="left" type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="url(#colorReceita2)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="taxa" stroke="#22c55e" fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion by lead type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Conversão por Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LeadConversionBar label="Quentes" icon={Flame} color="#ef4444" rate={stats.conversaoQuente} count={stats.leads.quente} />
            <LeadConversionBar label="Mornos" icon={Thermometer} color="#f59e0b" rate={stats.conversaoMorno} count={stats.leads.morno} />
            <LeadConversionBar label="Frios" icon={Snowflake} color="#3b82f6" rate={0} count={stats.leads.frio} />
            
            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Msgs p/ conversão</span>
                <span className="font-medium">{stats.avgMsgsConversao.toFixed(0)} msgs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Follow-ups enviados</span>
                <span className="font-medium">{stats.followUpsEnviados}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conversão follow-up</span>
                <span className="font-medium text-green-500">{stats.taxaFollowUp.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horários de Pico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Hour labels */}
                <div className="flex ml-10 mb-1">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
                      {h % 3 === 0 ? `${h}h` : ''}
                    </div>
                  ))}
                </div>
                {/* Grid */}
                {DIAS_SEMANA.map((dia, dayIdx) => (
                  <div key={dia} className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{dia}</span>
                    <div className="flex flex-1 gap-[1px]">
                      {Array.from({ length: 24 }, (_, h) => (
                        <div
                          key={h}
                          className="flex-1 aspect-square rounded-[2px] min-w-[12px]"
                          style={{ backgroundColor: getHeatmapColor(heatmapData.grid[dayIdx][h], heatmapData.maxVal) }}
                          title={`${dia} ${h}h: ${heatmapData.grid[dayIdx][h]} conversas`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center justify-end gap-1 mt-2">
                  <span className="text-[9px] text-muted-foreground">Menos</span>
                  {HEATMAP_COLORS.map((color, i) => (
                    <div key={i} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: color }} />
                  ))}
                  <span className="text-[9px] text-muted-foreground">Mais</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Top Produtos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-5 text-center ${idx < 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.categoria} • {p.qtd} vendidos</p>
                    </div>
                    <span className="text-sm font-semibold text-green-500 whitespace-nowrap">
                      R$ {p.receita.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Sem dados de vendas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Follow-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((item, idx) => {
                const prevValue = idx > 0 ? funnelData[idx - 1].value : item.value;
                const dropRate = prevValue > 0 && idx > 0 ? ((1 - item.value / prevValue) * 100).toFixed(0) : null;
                const widthPercent = funnelData[0].value > 0 ? Math.max((item.value / funnelData[0].value) * 100, 5) : 5;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{item.value}</span>
                        {dropRate && (
                          <Badge variant="outline" className="text-[10px] text-rose-500 border-rose-200">
                            <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />
                            {dropRate}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-6 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${widthPercent}%`, backgroundColor: item.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Follow-up effectiveness */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Efetividade dos Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-amber-500">{stats.followUpsPendentes}</p>
                <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-green-500">{stats.taxaFollowUp.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Taxa de Conversão</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Follow-ups enviados</span>
                <span className="font-medium">{stats.followUpsEnviados}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Convertidos após follow-up</span>
                <span className="font-medium text-green-500">{stats.followUpsConvertidos}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de conversas</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Com venda realizada</span>
                <span className="font-medium text-green-500">{stats.totalVendas}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// === Sub-components ===

function KPICard({ icon: Icon, label, value, color }: { icon: typeof ShoppingCart; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold truncate">{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadConversionBar({ label, icon: Icon, color, rate, count }: {
  label: string; icon: typeof Flame; color: string; rate: number; count: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          <span className="text-sm">{label}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5">{count}</Badge>
        </div>
        <span className="text-sm font-medium">{rate.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(rate, 2)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
