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
  Legend
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
  pink: '#ec4899',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  cyan: '#06b6d4',
  rose: '#f43f5e',
};

const PIE_COLORS = [COLORS.pink, COLORS.purple, COLORS.teal, COLORS.orange, COLORS.cyan, COLORS.rose];

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
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-purple-500 font-semibold">
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
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
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
  // Process sales data by month - memoized
  const barData = useMemo(() => {
    const vendasPorMes = vendas.reduce((acc, venda) => {
      const date = new Date(venda.created_at);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += Number(venda.total);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(vendasPorMes)
      .slice(-6)
      .map(([name, valor]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        valor: Math.round(valor),
      }));
  }, [vendas]);

  // Process pieces by category - memoized
  const pieData = useMemo(() => {
    const pecasPorCategoria = pecas.reduce((acc, peca) => {
      const categoria = peca.categoria || 'Sem Categoria';
      if (!acc[categoria]) {
        acc[categoria] = 0;
      }
      acc[categoria] += peca.estoque;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(pecasPorCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [pecas]);

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-8">
      {/* Bar Chart - Sales */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Vendas por Mês</CardTitle>
              <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[280px]">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.purple} stopOpacity={1} />
                      <stop offset="100%" stopColor={COLORS.pink} stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                  <Bar 
                    dataKey="valor" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhuma venda registrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Categories */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Estoque por Categoria</CardTitle>
              <p className="text-sm text-muted-foreground">Distribuição atual</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[280px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
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
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{value}</span>
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
