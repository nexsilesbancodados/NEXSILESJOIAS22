import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ShoppingBag,
  Target,
  Users,
  ArrowUp,
  ArrowDown,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Venda {
  id: string;
  created_at: string;
  valor_total: number;
  revendedora_id: string | null;
  cliente_id: string | null;
}

interface VendaPeca {
  peca_id: string;
  quantidade: number;
  preco_unitario: number;
  peca?: {
    nome: string;
    codigo: string;
  };
}

interface DesempenhoVendasProps {
  vendas: Venda[];
  vendasPecas: VendaPeca[];
  dateRange: { from: Date; to: Date } | undefined;
}

export const DesempenhoVendas = memo(function DesempenhoVendas({ 
  vendas, 
  vendasPecas,
  dateRange 
}: DesempenhoVendasProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Período anterior para comparação
  const periodoAnterior = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return { from: new Date(), to: new Date() };
    const diasPeriodo = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    return {
      from: subDays(dateRange.from, diasPeriodo),
      to: subDays(dateRange.to, diasPeriodo),
    };
  }, [dateRange]);

  // Vendas do período anterior
  const vendasPeriodoAnterior = useMemo(() => {
    return vendas.filter((venda) => {
      if (!venda?.created_at) return false;
      const vendaDate = new Date(venda.created_at);
      return isWithinInterval(vendaDate, {
        start: startOfDay(periodoAnterior.from),
        end: endOfDay(periodoAnterior.to),
      });
    });
  }, [vendas, periodoAnterior]);

  // Vendas do período atual
  const vendasPeriodoAtual = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    return vendas.filter((venda) => {
      if (!venda?.created_at) return false;
      const vendaDate = new Date(venda.created_at);
      return isWithinInterval(vendaDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to),
      });
    });
  }, [vendas, dateRange]);

  // KPIs comparativos
  const kpis = useMemo(() => {
    const faturamentoAtual = vendasPeriodoAtual.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
    const faturamentoAnterior = vendasPeriodoAnterior.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
    
    const qtdAtual = vendasPeriodoAtual.length;
    const qtdAnterior = vendasPeriodoAnterior.length;
    
    const ticketAtual = qtdAtual > 0 ? faturamentoAtual / qtdAtual : 0;
    const ticketAnterior = qtdAnterior > 0 ? faturamentoAnterior / qtdAnterior : 0;

    const clientesAtual = new Set(vendasPeriodoAtual.filter(v => v.cliente_id).map(v => v.cliente_id)).size;
    const clientesAnterior = new Set(vendasPeriodoAnterior.filter(v => v.cliente_id).map(v => v.cliente_id)).size;

    const calcVariacao = (atual: number, anterior: number) => {
      if (anterior === 0) return atual > 0 ? 100 : 0;
      return ((atual - anterior) / anterior) * 100;
    };

    return {
      faturamento: {
        atual: faturamentoAtual,
        anterior: faturamentoAnterior,
        variacao: calcVariacao(faturamentoAtual, faturamentoAnterior),
      },
      quantidade: {
        atual: qtdAtual,
        anterior: qtdAnterior,
        variacao: calcVariacao(qtdAtual, qtdAnterior),
      },
      ticket: {
        atual: ticketAtual,
        anterior: ticketAnterior,
        variacao: calcVariacao(ticketAtual, ticketAnterior),
      },
      clientes: {
        atual: clientesAtual,
        anterior: clientesAnterior,
        variacao: calcVariacao(clientesAtual, clientesAnterior),
      },
    };
  }, [vendasPeriodoAtual, vendasPeriodoAnterior]);

  // Vendas por hora do dia
  const vendasPorHora = useMemo(() => {
    const porHora: { [key: number]: { vendas: number; valor: number } } = {};
    
    // Inicializa todas as horas
    for (let i = 6; i <= 22; i++) {
      porHora[i] = { vendas: 0, valor: 0 };
    }

    vendasPeriodoAtual.forEach((venda) => {
      const hora = new Date(venda.created_at).getHours();
      if (hora >= 6 && hora <= 22) {
        porHora[hora].vendas += 1;
        porHora[hora].valor += Number(venda.valor_total || 0);
      }
    });

    return Object.entries(porHora).map(([hora, data]) => ({
      hora: `${hora}h`,
      vendas: data.vendas,
      valor: data.valor,
    }));
  }, [vendasPeriodoAtual]);

  // Vendas por dia da semana
  const vendasPorDiaSemana = useMemo(() => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const porDia: { [key: number]: { vendas: number; valor: number } } = {};
    
    for (let i = 0; i < 7; i++) {
      porDia[i] = { vendas: 0, valor: 0 };
    }

    vendasPeriodoAtual.forEach((venda) => {
      const dia = new Date(venda.created_at).getDay();
      porDia[dia].vendas += 1;
      porDia[dia].valor += Number(venda.valor_total || 0);
    });

    return diasSemana.map((nome, index) => ({
      dia: nome,
      vendas: porDia[index].vendas,
      valor: porDia[index].valor,
    }));
  }, [vendasPeriodoAtual]);

  // Top produtos vendidos
  const topProdutos = useMemo(() => {
    const porProduto: { [key: string]: { nome: string; quantidade: number; valor: number } } = {};
    
    vendasPecas.forEach((item) => {
      const id = item.peca_id;
      const nome = item.peca?.nome || 'Produto desconhecido';
      
      if (!porProduto[id]) {
        porProduto[id] = { nome, quantidade: 0, valor: 0 };
      }
      porProduto[id].quantidade += item.quantidade;
      porProduto[id].valor += item.quantidade * Number(item.preco_unitario || 0);
    });

    return Object.values(porProduto)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [vendasPecas]);

  const VariacaoIndicator = ({ variacao }: { variacao: number }) => {
    if (variacao > 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <ArrowUp className="w-3 h-3" />
          +{variacao.toFixed(1)}%
        </span>
      );
    }
    if (variacao < 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <ArrowDown className="w-3 h-3" />
          {variacao.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPIs Comparativos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Faturamento</span>
              <VariacaoIndicator variacao={kpis.faturamento.variacao} />
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(kpis.faturamento.atual)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Anterior: {formatCurrency(kpis.faturamento.anterior)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Vendas</span>
              <VariacaoIndicator variacao={kpis.quantidade.variacao} />
            </div>
            <p className="text-xl font-bold text-foreground">{kpis.quantidade.atual}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Anterior: {kpis.quantidade.anterior}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Ticket Médio</span>
              <VariacaoIndicator variacao={kpis.ticket.variacao} />
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(kpis.ticket.atual)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Anterior: {formatCurrency(kpis.ticket.anterior)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Clientes Únicos</span>
              <VariacaoIndicator variacao={kpis.clientes.variacao} />
            </div>
            <p className="text-xl font-bold text-foreground">{kpis.clientes.atual}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Anterior: {kpis.clientes.anterior}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Desempenho */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vendas por Hora */}
        <Card className="bg-card border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Vendas por Hora do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendasPorHora}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hora" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    interval={1}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'valor' ? formatCurrency(value) : value,
                      name === 'valor' ? 'Valor' : 'Vendas'
                    ]}
                  />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vendas por Dia da Semana */}
        <Card className="bg-card border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              Vendas por Dia da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendasPorDiaSemana}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'valor' ? formatCurrency(value) : value,
                      name === 'valor' ? 'Valor' : 'Vendas'
                    ]}
                  />
                  <Bar dataKey="vendas" fill="hsl(160 60% 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Produtos */}
      {topProdutos.length > 0 && (
        <Card className="bg-card border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProdutos.map((produto, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white",
                    index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600" :
                    index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500" :
                    index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{produto.nome}</p>
                    <p className="text-xs text-muted-foreground">{produto.quantidade} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(produto.valor)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});