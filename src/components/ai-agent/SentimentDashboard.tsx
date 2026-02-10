import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  SmilePlus, 
  Meh, 
  Frown, 
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useConversas } from '@/hooks/useConversas';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SENTIMENT_COLORS = {
  positivo: '#22c55e',
  neutro: '#f59e0b',
  negativo: '#ef4444',
};

const SENTIMENT_ICONS = {
  positivo: SmilePlus,
  neutro: Meh,
  negativo: Frown,
};

export function SentimentDashboard() {
  const { data: conversas = [] } = useConversas({});

  const stats = useMemo(() => {
    const withSentiment = conversas.filter((c: any) => c.sentimento);
    const positivo = withSentiment.filter((c: any) => c.sentimento === 'positivo').length;
    const neutro = withSentiment.filter((c: any) => c.sentimento === 'neutro').length;
    const negativo = withSentiment.filter((c: any) => c.sentimento === 'negativo').length;
    const total = withSentiment.length;

    const pieData = [
      { name: 'Positivo', value: positivo, color: SENTIMENT_COLORS.positivo },
      { name: 'Neutro', value: neutro, color: SENTIMENT_COLORS.neutro },
      { name: 'Negativo', value: negativo, color: SENTIMENT_COLORS.negativo },
    ].filter(d => d.value > 0);

    // Group by day for bar chart
    const byDay: Record<string, { positivo: number; neutro: number; negativo: number }> = {};
    withSentiment.forEach((c: any) => {
      const day = new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!byDay[day]) byDay[day] = { positivo: 0, neutro: 0, negativo: 0 };
      if (c.sentimento in byDay[day]) {
        byDay[day][c.sentimento as keyof typeof byDay[typeof day]]++;
      }
    });

    const barData = Object.entries(byDay)
      .slice(-14)
      .map(([dia, vals]) => ({ dia, ...vals }));

    return { positivo, neutro, negativo, total, pieData, barData };
  }, [conversas]);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Analisadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {(['positivo', 'neutro', 'negativo'] as const).map((s) => {
          const Icon = SENTIMENT_ICONS[s];
          return (
            <Card key={s}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-8 w-8" style={{ color: SENTIMENT_COLORS[s] }} />
                  <div>
                    <p className="text-2xl font-bold">{stats[s]}</p>
                    <p className="text-sm text-muted-foreground capitalize">{s}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Sentimento</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhuma conversa com análise de sentimento ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sentimento por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.barData}>
                  <XAxis dataKey="dia" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="positivo" fill={SENTIMENT_COLORS.positivo} stackId="stack" name="Positivo" />
                  <Bar dataKey="neutro" fill={SENTIMENT_COLORS.neutro} stackId="stack" name="Neutro" />
                  <Bar dataKey="negativo" fill={SENTIMENT_COLORS.negativo} stackId="stack" name="Negativo" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Dados insuficientes para o gráfico
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent negative conversations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Frown className="h-5 w-5 text-destructive" />
            Conversas com Sentimento Negativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversas.filter((c: any) => c.sentimento === 'negativo').length > 0 ? (
            <div className="space-y-2">
              {conversas
                .filter((c: any) => c.sentimento === 'negativo')
                .slice(0, 10)
                .map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{c.cliente_nome || 'Anônimo'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')} • {c.total_mensagens || 0} msgs
                      </p>
                    </div>
                    <Badge variant="destructive">Negativo</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhuma conversa negativa encontrada 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
