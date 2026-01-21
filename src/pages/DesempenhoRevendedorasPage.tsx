import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Clock,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

interface RevendedoraStats {
  id: string;
  nome: string;
  totalVendas: number;
  totalPecasVendidas: number;
  totalComissao: number;
  romaneiosFinalizados: number;
  romaneiosPendentes: number;
  taxaConversao: number;
  tempoMedioFechamento: number;
  maletasAtivas: number;
}

export default function DesempenhoRevendedorasPage() {
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d' | '12m'>('30d');

  const getPeriodDates = () => {
    const now = new Date();
    switch (periodo) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case '12m':
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  // Fetch revendedoras
  const { data: revendedoras = [], isLoading: loadingRevendedoras } = useQuery({
    queryKey: ['revendedoras-desempenho'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('revendedoras')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativa', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch romaneios for all revendedoras
  const { data: romaneios = [], isLoading: loadingRomaneios } = useQuery({
    queryKey: ['romaneios-desempenho', periodo],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { start } = getPeriodDates();
      
      const { data, error } = await supabase
        .from('romaneios')
        .select('*, romaneio_itens(*)')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString());
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch maletas
  const { data: maletas = [], isLoading: loadingMaletas } = useQuery({
    queryKey: ['maletas-desempenho'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('maletas')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate stats for each revendedora
  const revendedoraStats = useMemo<RevendedoraStats[]>(() => {
    return revendedoras.map(rev => {
      const revRomaneios = romaneios.filter(r => r.reseller_id === rev.id);
      const finalizados = revRomaneios.filter(r => r.status === 'finalizado');
      const pendentes = revRomaneios.filter(r => r.status === 'pendente');
      
      const totalVendas = finalizados.reduce((sum, r) => sum + (r.total || 0), 0);
      const totalComissao = finalizados.reduce((sum, r) => sum + (r.comissao || 0), 0);
      const totalPecasVendidas = finalizados.reduce((sum, r) => {
        const itens = (r as any).romaneio_itens || [];
        return sum + itens.reduce((s: number, i: any) => s + (i.quantidade || 0), 0);
      }, 0);
      
      // Taxa de conversão: romaneios finalizados / total de romaneios
      const taxaConversao = revRomaneios.length > 0 
        ? (finalizados.length / revRomaneios.length) * 100 
        : 0;
      
      // Tempo médio de fechamento em dias
      const temposFinalizacao = finalizados.map(r => {
        if (r.data && r.created_at) {
          const inicio = new Date(r.created_at);
          const fim = new Date(r.data);
          return (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
        }
        return 0;
      }).filter(t => t > 0);
      
      const tempoMedioFechamento = temposFinalizacao.length > 0
        ? temposFinalizacao.reduce((a, b) => a + b, 0) / temposFinalizacao.length
        : 0;
      
      const maletasAtivas = maletas.filter(m => m.revendedora_id === rev.id && m.status === 'emprestada').length;
      
      return {
        id: rev.id,
        nome: rev.nome,
        totalVendas,
        totalPecasVendidas,
        totalComissao,
        romaneiosFinalizados: finalizados.length,
        romaneiosPendentes: pendentes.length,
        taxaConversao,
        tempoMedioFechamento,
        maletasAtivas
      };
    }).sort((a, b) => b.totalVendas - a.totalVendas);
  }, [revendedoras, romaneios, maletas]);

  // Top 10 for ranking
  const top10 = revendedoraStats.slice(0, 10);

  // Totals
  const totals = useMemo(() => ({
    vendas: revendedoraStats.reduce((sum, r) => sum + r.totalVendas, 0),
    comissao: revendedoraStats.reduce((sum, r) => sum + r.totalComissao, 0),
    pecas: revendedoraStats.reduce((sum, r) => sum + r.totalPecasVendidas, 0),
    romaneios: revendedoraStats.reduce((sum, r) => sum + r.romaneiosFinalizados, 0),
  }), [revendedoraStats]);

  // Chart data for bar chart
  const barChartData = top10.map(r => ({
    nome: r.nome.split(' ')[0], // First name only
    vendas: r.totalVendas,
    comissao: r.totalComissao
  }));

  // Pie chart data for status distribution
  const pieChartData = useMemo(() => {
    const statusCounts = {
      finalizados: revendedoraStats.reduce((sum, r) => sum + r.romaneiosFinalizados, 0),
      pendentes: revendedoraStats.reduce((sum, r) => sum + r.romaneiosPendentes, 0),
    };
    return [
      { name: 'Finalizados', value: statusCounts.finalizados },
      { name: 'Pendentes', value: statusCounts.pendentes },
    ];
  }, [revendedoraStats]);

  const isLoading = loadingRevendedoras || loadingRomaneios || loadingMaletas;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Desempenho de Revendedoras</h1>
          <p className="text-muted-foreground">Acompanhe métricas e rankings das suas revendedoras</p>
        </div>
        <Select value={periodo} onValueChange={(v: typeof periodo) => setPeriodo(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="12m">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total em Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totals.vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {revendedoraStats.length} revendedoras ativas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Total em Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totals.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: R$ {revendedoraStats.length > 0 ? (totals.comissao / revendedoraStats.length).toFixed(2) : '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Peças Vendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.pecas.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              {totals.romaneios} romaneios finalizados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Maletas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maletas.filter(m => m.status === 'emprestada').length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {maletas.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Top Revendedoras */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              Top 10 Revendedoras por Vendas
            </CardTitle>
            <CardDescription>Comparativo de vendas e comissões</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="nome" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="vendas" name="Vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comissao" name="Comissão" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Romaneios</CardTitle>
            <CardDescription>Distribuição por situação</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ranking Completo
          </CardTitle>
          <CardDescription>Todas as métricas por revendedora</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Revendedora</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-right">Peças</TableHead>
                  <TableHead className="text-right">Conversão</TableHead>
                  <TableHead className="text-right">Tempo Médio</TableHead>
                  <TableHead className="text-right">Maletas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revendedoraStats.map((rev, index) => (
                  <TableRow key={rev.id}>
                    <TableCell>
                      {index < 3 ? (
                        <Badge 
                          variant={index === 0 ? 'default' : 'secondary'}
                          className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}
                        >
                          {index + 1}º
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{index + 1}º</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{rev.nome}</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {rev.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      R$ {rev.totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">{rev.totalPecasVendidas}</TableCell>
                    <TableCell className="text-right">
                      <span className={rev.taxaConversao >= 70 ? 'text-success' : rev.taxaConversao >= 40 ? 'text-warning' : 'text-destructive'}>
                        {rev.taxaConversao.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {rev.tempoMedioFechamento > 0 ? `${rev.tempoMedioFechamento.toFixed(0)} dias` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{rev.maletasAtivas}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {revendedoraStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma revendedora encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
