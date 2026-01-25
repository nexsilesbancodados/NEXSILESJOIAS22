import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Percent,
  Package,
  AlertCircle,
} from 'lucide-react';
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
} from 'recharts';
import { Peca } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';

interface LucratividadeTabProps {
  pecas: Peca[];
}

type SortField = 'nome' | 'custo' | 'preco' | 'margem_bruta' | 'margem_percentual' | 'estoque';

export function LucratividadeTab({ pecas }: LucratividadeTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [sortField, setSortField] = useState<SortField>('margem_percentual');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate profitability data
  const profitabilityData = useMemo(() => {
    return pecas.map((peca) => {
      const custo = peca.preco_custo || 0;
      const precoVenda = peca.preco_venda || 0;
      const margemBruta = precoVenda - custo;
      const margemPercentual = custo > 0 ? ((margemBruta / custo) * 100) : 0;
      
      return {
        ...peca,
        custo_calculado: custo,
        preco_calculado: precoVenda,
        margem_bruta: margemBruta,
        margem_percentual: margemPercentual,
        lucro_potencial: margemBruta * (peca.estoque || 0),
        status: margemPercentual < 0 ? 'negativa' : margemPercentual < 30 ? 'baixa' : margemPercentual < 60 ? 'normal' : 'alta',
      };
    });
  }, [pecas]);

  // Get unique categories
  const categorias = useMemo(() => {
    const cats = [...new Set(pecas.map(p => p.categoria).filter(Boolean))];
    return cats.sort();
  }, [pecas]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    return profitabilityData
      .filter((item) => {
        const matchesSearch = 
          item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategoria = filterCategoria === 'all' || item.categoria === filterCategoria;
        return matchesSearch && matchesCategoria;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'nome':
            comparison = a.nome.localeCompare(b.nome);
            break;
          case 'custo':
            comparison = a.custo_calculado - b.custo_calculado;
            break;
          case 'preco':
            comparison = a.preco_calculado - b.preco_calculado;
            break;
          case 'margem_bruta':
            comparison = a.margem_bruta - b.margem_bruta;
            break;
          case 'margem_percentual':
            comparison = a.margem_percentual - b.margem_percentual;
            break;
          case 'estoque':
            comparison = a.estoque - b.estoque;
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [profitabilityData, searchTerm, filterCategoria, sortField, sortDirection]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = profitabilityData.length;
    const comMargemNegativa = profitabilityData.filter(p => p.margem_percentual < 0).length;
    const comMargemBaixa = profitabilityData.filter(p => p.margem_percentual >= 0 && p.margem_percentual < 30).length;
    const comMargemNormal = profitabilityData.filter(p => p.margem_percentual >= 30 && p.margem_percentual < 60).length;
    const comMargemAlta = profitabilityData.filter(p => p.margem_percentual >= 60).length;
    
    const margemMediaPonderada = profitabilityData.reduce((acc, p) => acc + p.margem_bruta, 0) / total || 0;
    const margemPercentualMedia = profitabilityData.reduce((acc, p) => acc + p.margem_percentual, 0) / total || 0;
    const lucroPotencialTotal = profitabilityData.reduce((acc, p) => acc + p.lucro_potencial, 0);
    const valorEstoqueVenda = profitabilityData.reduce((acc, p) => acc + (p.preco_calculado * p.estoque), 0);
    const valorEstoqueCusto = profitabilityData.reduce((acc, p) => acc + (p.custo_calculado * p.estoque), 0);

    return {
      total,
      comMargemNegativa,
      comMargemBaixa,
      comMargemNormal,
      comMargemAlta,
      margemMediaPonderada,
      margemPercentualMedia,
      lucroPotencialTotal,
      valorEstoqueVenda,
      valorEstoqueCusto,
    };
  }, [profitabilityData]);

  // Chart data - Top 10 most profitable
  const topProfitableChart = useMemo(() => {
    return [...profitabilityData]
      .sort((a, b) => b.margem_percentual - a.margem_percentual)
      .slice(0, 10)
      .map((p) => ({
        nome: p.nome.length > 15 ? p.nome.substring(0, 15) + '...' : p.nome,
        margem: p.margem_percentual,
        lucro: p.margem_bruta,
      }));
  }, [profitabilityData]);

  // Chart data - Margin distribution
  const marginDistribution = useMemo(() => {
    return [
      { name: 'Negativa (<0%)', value: stats.comMargemNegativa, color: 'hsl(0 70% 50%)' },
      { name: 'Baixa (0-30%)', value: stats.comMargemBaixa, color: 'hsl(38 70% 50%)' },
      { name: 'Normal (30-60%)', value: stats.comMargemNormal, color: 'hsl(220 70% 50%)' },
      { name: 'Alta (>60%)', value: stats.comMargemAlta, color: 'hsl(160 60% 40%)' },
    ];
  }, [stats]);

  // Chart data - Profit by category
  const profitByCategory = useMemo(() => {
    const byCategory: { [key: string]: { categoria: string; lucro: number; quantidade: number } } = {};
    
    profitabilityData.forEach((p) => {
      const cat = p.categoria || 'Sem categoria';
      if (!byCategory[cat]) {
        byCategory[cat] = { categoria: cat, lucro: 0, quantidade: 0 };
      }
      byCategory[cat].lucro += p.lucro_potencial;
      byCategory[cat].quantidade += p.estoque;
    });

    return Object.values(byCategory)
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 8);
  }, [profitabilityData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" /> 
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const getMarginBadge = (status: string, percentual: number) => {
    switch (status) {
      case 'negativa':
        return (
          <Badge variant="destructive" className="gap-1">
            <TrendingDown className="w-3 h-3" />
            {percentual.toFixed(1)}%
          </Badge>
        );
      case 'baixa':
        return (
          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            {percentual.toFixed(1)}%
          </Badge>
        );
      case 'normal':
        return (
          <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {percentual.toFixed(1)}%
          </Badge>
        );
      case 'alta':
        return (
          <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            {percentual.toFixed(1)}%
          </Badge>
        );
      default:
        return <Badge>{percentual.toFixed(1)}%</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Lucro Potencial</p>
              <p className="text-white text-lg font-bold truncate">{formatCurrency(stats.lucroPotencialTotal)}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Margem Média</p>
              <p className="text-white text-lg font-bold">{stats.margemPercentualMedia.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Valor Estoque (Venda)</p>
              <p className="text-white text-lg font-bold truncate">{formatCurrency(stats.valorEstoqueVenda)}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Valor Estoque (Custo)</p>
              <p className="text-white text-lg font-bold truncate">{formatCurrency(stats.valorEstoqueCusto)}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Alta Margem</p>
              <p className="text-white text-lg font-bold">{stats.comMargemAlta}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-red-400 via-rose-500 to-pink-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Margem Negativa</p>
              <p className="text-white text-lg font-bold">{stats.comMargemNegativa}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts for negative margin items */}
      {stats.comMargemNegativa > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5" />
              Atenção: {stats.comMargemNegativa} peça(s) com margem negativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              As seguintes peças estão sendo vendidas abaixo do custo:
            </p>
            <div className="flex flex-wrap gap-2">
              {profitabilityData
                .filter(p => p.margem_percentual < 0)
                .slice(0, 5)
                .map((p) => (
                  <Badge key={p.id} variant="destructive" className="text-xs">
                    {p.nome} ({p.margem_percentual.toFixed(1)}%)
                  </Badge>
                ))}
              {stats.comMargemNegativa > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{stats.comMargemNegativa - 5} outras
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top 10 Most Profitable */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Top 10 Mais Lucrativas (% Margem)</CardTitle>
          </CardHeader>
          <CardContent>
            {topProfitableChart.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProfitableChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
                    <YAxis 
                      dataKey="nome" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'margem' ? `${value.toFixed(1)}%` : formatCurrency(value),
                        name === 'margem' ? 'Margem' : 'Lucro'
                      ]}
                    />
                    <Bar dataKey="margem" fill="hsl(160 60% 40%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Nenhuma peça cadastrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Margin Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display">Distribuição de Margens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marginDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {marginDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} peças`, 'Quantidade']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit by Category */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display">Lucro Potencial por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {profitByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="categoria" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'lucro' ? formatCurrency(value) : value,
                      name === 'lucro' ? 'Lucro Potencial' : 'Quantidade'
                    ]}
                  />
                  <Bar dataKey="lucro" name="Lucro Potencial" fill="hsl(38 70% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhuma categoria cadastrada
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display">Detalhamento por Peça</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <button 
                      onClick={() => handleSort('nome')} 
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Peça {getSortIcon('nome')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button 
                      onClick={() => handleSort('custo')} 
                      className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                    >
                      Custo {getSortIcon('custo')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button 
                      onClick={() => handleSort('preco')} 
                      className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                    >
                      Preço Venda {getSortIcon('preco')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button 
                      onClick={() => handleSort('margem_bruta')} 
                      className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                    >
                      Margem R$ {getSortIcon('margem_bruta')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button 
                      onClick={() => handleSort('margem_percentual')} 
                      className="flex items-center justify-center w-full hover:text-foreground transition-colors"
                    >
                      Margem % {getSortIcon('margem_percentual')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button 
                      onClick={() => handleSort('estoque')} 
                      className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                    >
                      Estoque {getSortIcon('estoque')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Lucro Potencial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 50).map((item) => (
                  <TableRow key={item.id} className={cn(
                    item.status === 'negativa' && 'bg-destructive/5'
                  )}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">{item.codigo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(item.custo_calculado)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(item.preco_calculado)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono text-sm",
                      item.margem_bruta < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {item.margem_bruta >= 0 && '+'}
                      {formatCurrency(item.margem_bruta)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getMarginBadge(item.status, item.margem_percentual)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {item.estoque}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono text-sm font-medium",
                      item.lucro_potencial < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {formatCurrency(item.lucro_potencial)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredData.length > 50 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Exibindo 50 de {filteredData.length} peças
            </p>
          )}
          
          {filteredData.length === 0 && (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma peça encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
