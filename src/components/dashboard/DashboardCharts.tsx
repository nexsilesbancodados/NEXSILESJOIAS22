import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface VendaData {
  created_at: string;
  total: number;
}

interface CategoriaData {
  categoria: string | null;
  estoque: number;
}

interface DashboardChartsProps {
  vendas: VendaData[];
  pecas: CategoriaData[];
}

const COLORS = {
  emerald: 'hsl(158 64% 45%)',
  blue: 'hsl(217 91% 60%)',
  purple: 'hsl(263 70% 50%)',
  amber: 'hsl(38 92% 50%)',
  rose: 'hsl(340 80% 60%)',
  cyan: 'hsl(187 85% 50%)',
};

const PIE_COLORS = [COLORS.emerald, COLORS.blue, COLORS.purple, COLORS.amber, COLORS.rose, COLORS.cyan];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-primary font-semibold">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
        <p className="text-sm font-semibold" style={{ color: payload[0].payload.fill }}>
          {payload[0].value} peças
        </p>
      </div>
    );
  }
  return null;
};

export const DashboardCharts = memo(function DashboardCharts({ vendas, pecas }: DashboardChartsProps) {
  // Process sales data by month - memoized with null safety
  const areaData = useMemo(() => {
    const safeVendas = vendas || [];
    const vendasPorMes = safeVendas.reduce((acc, venda) => {
      if (!venda?.created_at) return acc;
      const date = new Date(venda.created_at);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += Number(venda.total || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(vendasPorMes)
      .slice(-12)
      .map(([name, valor]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        valor: Math.round(valor),
      }));
  }, [vendas]);

  // Process pieces by category - memoized with null safety
  const pieData = useMemo(() => {
    const safePecas = pecas || [];
    const pecasPorCategoria = safePecas.reduce((acc, peca) => {
      if (!peca) return acc;
      const categoria = peca.categoria || 'Sem Categoria';
      if (!acc[categoria]) {
        acc[categoria] = 0;
      }
      acc[categoria] += peca.estoque || 0;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(pecasPorCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [pecas]);

  // Calculate highlight
  const totalVendas = useMemo(() => areaData.reduce((acc, d) => acc + d.valor, 0), [areaData]);
  const maxMonth = useMemo(() => areaData.reduce((max, d) => d.valor > max.valor ? d : max, areaData[0] || { name: '', valor: 0 }), [areaData]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Area Chart - Sales */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Total de Vendas</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Clientes que compraram no último ano</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[220px] relative">
            {areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(158 64% 45%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(158 64% 45%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="hsl(158 64% 45%)" 
                    strokeWidth={2}
                    fill="url(#areaGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'hsl(158 64% 45%)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhuma venda registrada
              </div>
            )}

            {/* Highlight bubble */}
            {areaData.length > 0 && maxMonth.valor > 0 && (
              <div 
                className="absolute bg-gradient-to-br from-lime-300 to-emerald-400 text-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-md"
                style={{ left: '35%', top: '15%' }}
              >
                <span className="text-sm font-bold">+{((maxMonth.valor / totalVendas) * 100).toFixed(0)}%</span>
                <span className="block text-[10px] opacity-80">Mês destaque</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Categories */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Estoque por Categoria</CardTitle>
                <p className="text-xs text-muted-foreground">Distribuição atual</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[220px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhuma categoria registrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
