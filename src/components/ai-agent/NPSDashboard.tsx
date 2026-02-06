import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Calendar,
  Users,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface NPSData {
  conversas: Array<{
    id: string;
    nps_rating: number | null;
    nps_comentario: string | null;
    nps_enviado_at: string | null;
    cliente_nome: string | null;
    cliente_telefone: string | null;
    created_at: string;
  }>;
}

export function NPSDashboard() {
  const { organizationId } = useOrganization();
  const [periodo, setPeriodo] = useState('30');

  const { data, isLoading } = useQuery({
    queryKey: ['nps-dashboard', organizationId, periodo],
    queryFn: async (): Promise<NPSData> => {
      const dataInicio = subMonths(new Date(), parseInt(periodo) / 30);
      
      const { data: conversas, error } = await supabase
        .from('agente_conversas')
        .select('id, nps_rating, nps_comentario, nps_enviado_at, cliente_nome, cliente_telefone, created_at')
        .eq('organization_id', organizationId!)
        .not('nps_rating', 'is', null)
        .gte('created_at', dataInicio.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { conversas: conversas || [] };
    },
    enabled: !!organizationId
  });

  const stats = useMemo(() => {
    if (!data?.conversas) return null;

    const total = data.conversas.length;
    if (total === 0) return null;

    const promotores = data.conversas.filter(c => c.nps_rating! >= 9).length;
    const neutros = data.conversas.filter(c => c.nps_rating! >= 7 && c.nps_rating! < 9).length;
    const detratores = data.conversas.filter(c => c.nps_rating! < 7).length;

    const npsScore = Math.round(((promotores - detratores) / total) * 100);
    const mediaRating = data.conversas.reduce((acc, c) => acc + (c.nps_rating || 0), 0) / total;

    // Group by day for chart
    const byDay = new Map<string, number[]>();
    data.conversas.forEach(c => {
      const day = format(new Date(c.created_at), 'yyyy-MM-dd');
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(c.nps_rating!);
    });

    const chartData = Array.from(byDay.entries())
      .map(([date, ratings]) => ({
        date,
        dateFormatted: format(new Date(date), 'dd/MM', { locale: ptBR }),
        nps: Math.round(
          ((ratings.filter(r => r >= 9).length - ratings.filter(r => r < 7).length) / ratings.length) * 100
        ),
        respostas: ratings.length,
        media: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total,
      promotores,
      neutros,
      detratores,
      npsScore,
      mediaRating,
      chartData,
      alertasNegativos: data.conversas.filter(c => c.nps_rating! < 7 && c.nps_comentario)
    };
  }, [data]);

  const COLORS = ['#22c55e', '#eab308', '#ef4444'];

  if (!organizationId) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard NPS</h2>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="180">Últimos 6 meses</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando dados...</div>
      ) : !stats ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhuma avaliação NPS encontrada no período selecionado.</p>
            <p className="text-sm text-muted-foreground mt-2">
              As avaliações aparecerão aqui quando os clientes responderem à pesquisa de satisfação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${
                    stats.npsScore >= 50 ? 'bg-green-100 text-green-600' :
                    stats.npsScore >= 0 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {stats.npsScore >= 50 ? <TrendingUp className="h-6 w-6" /> :
                     stats.npsScore >= 0 ? <Meh className="h-6 w-6" /> :
                     <TrendingDown className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.npsScore}</p>
                    <p className="text-sm text-muted-foreground">NPS Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Respostas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.mediaRating.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Média Geral</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${
                    stats.alertasNegativos.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.alertasNegativos.length}</p>
                    <p className="text-sm text-muted-foreground">Alertas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* NPS Over Time */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Evolução do NPS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dateFormatted" tick={{ fontSize: 12 }} />
                      <YAxis domain={[-100, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        labelFormatter={(label) => `Data: ${label}`}
                        formatter={(value: number, name: string) => {
                          if (name === 'nps') return [`${value}`, 'NPS Score'];
                          return [value, name];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="nps"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Promotores (9-10)', value: stats.promotores },
                          { name: 'Neutros (7-8)', value: stats.neutros },
                          { name: 'Detratores (0-6)', value: stats.detratores }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs">{stats.promotores} Promotores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-xs">{stats.neutros} Neutros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs">{stats.detratores} Detratores</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Negative Alerts */}
          {stats.alertasNegativos.length > 0 && (
            <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de Avaliações Negativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {stats.alertasNegativos.map((alerta) => (
                      <div
                        key={alerta.id}
                        className="p-4 rounded-lg bg-background border border-red-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {alerta.nps_rating}
                              </Badge>
                              <span className="font-medium">
                                {alerta.cliente_nome || alerta.cliente_telefone || 'Cliente Anônimo'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              "{alerta.nps_comentario}"
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(alerta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Recent Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avaliações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {data?.conversas.slice(0, 20).map((conversa) => (
                    <div
                      key={conversa.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          conversa.nps_rating! >= 9 ? 'bg-green-100 text-green-600' :
                          conversa.nps_rating! >= 7 ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {conversa.nps_rating! >= 9 ? <ThumbsUp className="h-4 w-4" /> :
                           conversa.nps_rating! >= 7 ? <Meh className="h-4 w-4" /> :
                           <ThumbsDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {conversa.cliente_nome || conversa.cliente_telefone || 'Cliente Anônimo'}
                          </p>
                          {conversa.nps_comentario && (
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              "{conversa.nps_comentario}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          conversa.nps_rating! >= 9 ? 'default' :
                          conversa.nps_rating! >= 7 ? 'secondary' : 'destructive'
                        }>
                          {conversa.nps_rating}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conversa.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
