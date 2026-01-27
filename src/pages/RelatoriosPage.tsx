import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GalvanicaReportExport } from '@/components/export/GalvanicaReportExport';
import { LucratividadeTab } from '@/components/reports/LucratividadeTab';
import { DesempenhoVendas } from '@/components/reports/DesempenhoVendas';
import { ReplenishmentReport } from '@/components/reports/ReplenishmentReport';
import { ExportBuilder } from '@/components/export/ExportBuilder';
import { useFornecedores } from '@/hooks/useSupabaseData';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag,
  Target,
  Users,
  Package,
  Loader2,
  Droplets,
  Scale,
  ArrowUpDown,
  PiggyBank,
  FileSpreadsheet,
  PackageX,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { format, subDays, subWeeks, isWithinInterval, startOfDay, endOfDay, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { useVendas, usePecas, useRevendedoras, useRomaneios, useEnviosGalvanica, useBanhos, useVendasPecas } from '@/hooks/useSupabaseData';
import { useClientes } from '@/hooks/useClientes';

const PERIODOS = [
  { id: 'hoje', label: 'Hoje', days: 0 },
  { id: 'semanal', label: 'Semanal', days: 7 },
  { id: 'quinzenal', label: 'Quinzenal', days: 15 },
  { id: 'mensal', label: 'Mensal', days: 30 },
  { id: 'trimestral', label: 'Trimestral', days: 90 },
  { id: 'personalizado', label: 'Personalizado', days: -1 },
];

const COLORS = ['hsl(38 70% 50%)', 'hsl(160 60% 40%)', 'hsl(15 60% 70%)', 'hsl(0 70% 50%)', 'hsl(220 70% 50%)'];

export default function RelatoriosPage() {
  const { data: vendas = [], isLoading: loadingVendas } = useVendas();
  const { data: pecas = [], isLoading: loadingPecas } = usePecas();
  const { data: revendedoras = [], isLoading: loadingRevendedoras } = useRevendedoras();
  const { data: romaneios = [], isLoading: loadingRomaneios } = useRomaneios();
  const { data: enviosGalvanica = [], isLoading: loadingEnvios } = useEnviosGalvanica();
  const { data: banhos = [], isLoading: loadingBanhos } = useBanhos();
  const { data: vendasPecas = [] } = useVendasPecas();
  const { data: clientes = [] } = useClientes();
  const { data: fornecedores = [] } = useFornecedores();
  
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mensal');
  const [isExportBuilderOpen, setIsExportBuilderOpen] = useState(false);
  const [isReplenishmentOpen, setIsReplenishmentOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const handlePeriodoChange = (periodoId: string) => {
    setPeriodoSelecionado(periodoId);
    const hoje = new Date();
    
    switch (periodoId) {
      case 'hoje':
        setDateRange({ from: startOfDay(hoje), to: endOfDay(hoje) });
        break;
      case 'semanal':
        setDateRange({ from: subDays(hoje, 7), to: hoje });
        break;
      case 'quinzenal':
        setDateRange({ from: subDays(hoje, 15), to: hoje });
        break;
      case 'mensal':
        setDateRange({ from: subDays(hoje, 30), to: hoje });
        break;
      case 'trimestral':
        setDateRange({ from: subDays(hoje, 90), to: hoje });
        break;
      case 'personalizado':
        // Keep current range, user will select manually
        break;
    }
  };

  const isLoading = loadingVendas || loadingPecas || loadingRevendedoras || loadingRomaneios || loadingEnvios || loadingBanhos;

  const filteredVendas = useMemo(() => {
    const safeVendas = vendas || [];
    if (!dateRange?.from || !dateRange?.to) return safeVendas;
    
    return safeVendas.filter((venda) => {
      if (!venda?.created_at) return false;
      const vendaDate = new Date(venda.created_at);
      return isWithinInterval(vendaDate, {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to!),
      });
    });
  }, [vendas, dateRange]);

  const stats = useMemo(() => {
    const safeFilteredVendas = filteredVendas || [];
    const safeRomaneios = romaneios || [];
    
    const faturamento = safeFilteredVendas.reduce((acc, v) => acc + Number(v?.valor_total || 0), 0);
    const vendasPDV = safeFilteredVendas.filter(v => v?.revendedora_id === null);
    const vendasRevendedoras = safeFilteredVendas.filter(v => v?.revendedora_id !== null);
    const ticketMedio = safeFilteredVendas.length > 0 ? faturamento / safeFilteredVendas.length : 0;
    const romaneiosPendentes = safeRomaneios.filter(r => r?.status === 'pendente').length;
    const comissaoTotal = vendasRevendedoras.reduce((acc, v) => acc + Number(v?.valor_total || 0) * 0.1, 0);

    return { 
      faturamento, 
      ticketMedio, 
      totalVendas: safeFilteredVendas.length,
      vendasPDV: vendasPDV.length,
      vendasRevendedoras: vendasRevendedoras.length,
      romaneiosPendentes,
      comissaoTotal,
    };
  }, [filteredVendas, romaneios]);

  const chartData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];

    const dailyData: { [key: string]: { pdv: number; revendedora: number } } = {};
    
    filteredVendas.forEach((venda) => {
      const dateKey = format(new Date(venda.created_at), 'dd/MM');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { pdv: 0, revendedora: 0 };
      }
      if (venda.revendedora_id === null) {
        dailyData[dateKey].pdv += Number(venda.valor_total);
      } else {
        dailyData[dateKey].revendedora += Number(venda.valor_total);
      }
    });

    return Object.entries(dailyData).map(([date, values]) => ({
      date,
      pdv: values.pdv,
      revendedora: values.revendedora,
      total: values.pdv + values.revendedora,
    }));
  }, [filteredVendas, dateRange]);

  const categoriaData = useMemo(() => {
    const categorias: { [key: string]: number } = {};
    pecas.forEach(peca => {
      const cat = peca.categoria || 'Sem categoria';
      categorias[cat] = (categorias[cat] || 0) + peca.estoque;
    });
    
    return Object.entries(categorias).map(([name, value]) => ({
      name,
      value,
    }));
  }, [pecas]);

  const estoqueData = useMemo(() => {
    const estoqueBaixo = pecas.filter(p => p.estoque <= 5).length;
    const estoqueNormal = pecas.filter(p => p.estoque > 5 && p.estoque <= 20).length;
    const estoqueAlto = pecas.filter(p => p.estoque > 20).length;
    
    return [
      { name: 'Estoque Baixo (≤5)', value: estoqueBaixo, color: 'hsl(0 70% 50%)' },
      { name: 'Estoque Normal (6-20)', value: estoqueNormal, color: 'hsl(38 70% 50%)' },
      { name: 'Estoque Alto (>20)', value: estoqueAlto, color: 'hsl(160 60% 40%)' },
    ];
  }, [pecas]);

  const topRevendedoras = useMemo(() => {
    const vendaPorRevendedora: { [key: string]: { nome: string; total: number; vendas: number } } = {};
    
    romaneios.filter(r => r.status === 'confirmado').forEach(romaneio => {
      const resellerId = romaneio.reseller_id || '';
      if (!vendaPorRevendedora[resellerId]) {
        vendaPorRevendedora[resellerId] = {
          nome: romaneio.revendedora_nome || 'Sem nome',
          total: 0,
          vendas: 0,
        };
      }
      vendaPorRevendedora[resellerId].total += Number(romaneio.total);
      vendaPorRevendedora[resellerId].vendas += 1;
    });
    
    return Object.values(vendaPorRevendedora)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [romaneios]);

  // ============ DADOS GALVÂNICA ============
  const filteredEnviosGalvanica = useMemo(() => {
    const safeEnvios = enviosGalvanica || [];
    if (!dateRange?.from || !dateRange?.to) return safeEnvios;
    
    return safeEnvios.filter((envio) => {
      if (!envio) return false;
      const envioDate = new Date(envio.data_envio || envio.created_at);
      return isWithinInterval(envioDate, {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to!),
      });
    });
  }, [enviosGalvanica, dateRange]);

  const galvanicaStats = useMemo(() => {
    const safeEnvios = filteredEnviosGalvanica || [];
    const custoTotal = safeEnvios.reduce((acc, e) => acc + Number(e?.valor_total || 0), 0);
    const pesoTotal = safeEnvios.reduce((acc, e) => acc + Number(e?.peso_total || 0), 0);
    const totalEnvios = safeEnvios.length;
    const enviosPendentes = safeEnvios.filter(e => e?.status === 'pendente' || e?.status === 'enviado').length;
    const enviosRetornados = safeEnvios.filter(e => e?.status === 'retornado' || e?.status === 'concluído').length;
    const custoMedioKg = pesoTotal > 0 ? custoTotal / (pesoTotal / 1000) : 0;

    return {
      custoTotal,
      pesoTotal,
      totalEnvios,
      enviosPendentes,
      enviosRetornados,
      custoMedioKg,
    };
  }, [filteredEnviosGalvanica]);

  const galvanicaEvolutionData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];

    const dailyData: { [key: string]: { custo: number; peso: number; envios: number } } = {};
    
    filteredEnviosGalvanica.forEach((envio) => {
      const dateKey = format(new Date(envio.data_envio || envio.created_at), 'dd/MM');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { custo: 0, peso: 0, envios: 0 };
      }
      dailyData[dateKey].custo += Number(envio.valor_total || 0);
      dailyData[dateKey].peso += Number(envio.peso_total || 0);
      dailyData[dateKey].envios += 1;
    });

    return Object.entries(dailyData).map(([date, values]) => ({
      date,
      custo: values.custo,
      peso: values.peso,
      envios: values.envios,
    }));
  }, [filteredEnviosGalvanica, dateRange]);

  const galvanicaPorBanhoData = useMemo(() => {
    const porBanho: { [key: string]: { nome: string; custo: number; peso: number; envios: number } } = {};
    
    filteredEnviosGalvanica.forEach((envio) => {
      const banhoNome = envio.banho?.nome || 'Sem banho';
      if (!porBanho[banhoNome]) {
        porBanho[banhoNome] = { nome: banhoNome, custo: 0, peso: 0, envios: 0 };
      }
      porBanho[banhoNome].custo += Number(envio.valor_total || 0);
      porBanho[banhoNome].peso += Number(envio.peso_total || 0);
      porBanho[banhoNome].envios += 1;
    });

    return Object.values(porBanho)
      .sort((a, b) => b.custo - a.custo)
      .slice(0, 8);
  }, [filteredEnviosGalvanica]);

  const galvanicaStatusData = useMemo(() => {
    const pendentes = filteredEnviosGalvanica.filter(e => e.status === 'pendente').length;
    const enviados = filteredEnviosGalvanica.filter(e => e.status === 'enviado').length;
    const retornados = filteredEnviosGalvanica.filter(e => e.status === 'retornado' || e.status === 'concluído').length;

    return [
      { name: 'Pendentes', value: pendentes, color: 'hsl(38 70% 50%)' },
      { name: 'Enviados', value: enviados, color: 'hsl(220 70% 50%)' },
      { name: 'Retornados', value: retornados, color: 'hsl(160 60% 40%)' },
    ];
  }, [filteredEnviosGalvanica]);

  const galvanicaMensalData = useMemo(() => {
    const mensal: { [key: string]: { mes: string; custo: number; peso: number } } = {};
    
    enviosGalvanica.forEach((envio) => {
      const mesKey = format(new Date(envio.data_envio || envio.created_at), 'MMM/yy', { locale: ptBR });
      if (!mensal[mesKey]) {
        mensal[mesKey] = { mes: mesKey, custo: 0, peso: 0 };
      }
      mensal[mesKey].custo += Number(envio.valor_total || 0);
      mensal[mesKey].peso += Number(envio.peso_total || 0);
    });

    return Object.values(mensal).slice(-12);
  }, [enviosGalvanica]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h1>
              <p className="text-sm text-muted-foreground">Sua inteligência de negócio</p>
            </div>
          </div>

          {/* Period Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Period Buttons */}
            <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
              {PERIODOS.map((periodo) => (
                <Button
                  key={periodo.id}
                  variant={periodoSelecionado === periodo.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handlePeriodoChange(periodo.id)}
                  className={cn(
                    'text-xs',
                    periodoSelecionado === periodo.id && 'bg-primary text-primary-foreground'
                  )}
                >
                  {periodo.label}
                </Button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            {periodoSelecionado === 'personalizado' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      'Selecionar'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Botão Reposição de Estoque */}
            <Button onClick={() => setIsReplenishmentOpen(true)} variant="outline" size="sm" className="gap-2">
              <PackageX className="w-4 h-4" />
              Reposição
            </Button>

            {/* Botão Relatório Avançado */}
            <Button onClick={() => setIsExportBuilderOpen(true)} variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Relatório Avançado
            </Button>
          </div>
        </div>

        {/* Period Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          {dateRange?.from && dateRange?.to && (
            <span>
              Exibindo dados de <strong>{format(dateRange.from, "dd 'de' MMMM", { locale: ptBR })}</strong> até{' '}
              <strong>{format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Faturamento</p>
              <p className="text-white text-lg font-bold truncate">{formatCurrency(stats.faturamento)}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Ticket Médio</p>
              <p className="text-white text-lg font-bold truncate">{formatCurrency(stats.ticketMedio)}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Total Vendas</p>
              <p className="text-white text-lg font-bold">{stats.totalVendas}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Vendas PDV</p>
              <p className="text-white text-lg font-bold">{stats.vendasPDV}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Revendedoras</p>
              <p className="text-white text-lg font-bold">{stats.vendasRevendedoras}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Comissões</p>
              <p className="text-white text-lg font-bold truncate">{formatCurrency(stats.comissaoTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="lucratividade" className="gap-1">
            <PiggyBank className="w-4 h-4" />
            Lucratividade
          </TabsTrigger>
          <TabsTrigger value="galvanica">Galvânica</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="revendedoras">Revendedoras</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          {/* Desempenho e Comparativos */}
          <DesempenhoVendas 
            vendas={vendas as any} 
            vendasPecas={vendasPecas as any}
            dateRange={dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined}
          />
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sales Chart */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-display">Faturamento por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPdv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(38 70% 50%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(38 70% 50%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorRevendedora" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(160 60% 40%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(160 60% 40%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [
                            formatCurrency(value), 
                            name === 'pdv' ? 'PDV' : 'Revendedoras'
                          ]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="pdv"
                          name="PDV"
                          stroke="hsl(38 70% 50%)"
                          strokeWidth={2}
                          fill="url(#colorPdv)"
                        />
                        <Area
                          type="monotone"
                          dataKey="revendedora"
                          name="Revendedoras"
                          stroke="hsl(160 60% 40%)"
                          strokeWidth={2}
                          fill="url(#colorRevendedora)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">Nenhuma venda no período selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sales by Type */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Vendas por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'PDV', value: stats.vendasPDV },
                          { name: 'Revendedoras', value: stats.vendasRevendedoras },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="hsl(38 70% 50%)" />
                        <Cell fill="hsl(160 60% 40%)" />
                      </Pie>
                      <Legend />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ ABA LUCRATIVIDADE ============ */}
        <TabsContent value="lucratividade" className="space-y-6">
          <LucratividadeTab pecas={pecas} />
        </TabsContent>

        {/* ============ ABA GALVÂNICA ============ */}
        <TabsContent value="galvanica" className="space-y-6">
          {/* Header com Export */}
          <div className="flex justify-end">
            <GalvanicaReportExport
              stats={galvanicaStats}
              evolutionData={galvanicaEvolutionData}
              porBanhoData={galvanicaPorBanhoData}
              statusData={galvanicaStatusData}
              mensalData={galvanicaMensalData}
              dateRange={dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined}
            />
          </div>
          
          {/* Stats Cards Galvânica */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium">Custo Total</p>
                  <p className="text-white text-lg font-bold truncate">{formatCurrency(galvanicaStats.custoTotal)}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-amber-400 via-orange-500 to-red-500">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium">Peso Total</p>
                  <p className="text-white text-lg font-bold">{galvanicaStats.pesoTotal.toFixed(1)}g</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium">Total Envios</p>
                  <p className="text-white text-lg font-bold">{galvanicaStats.totalEnvios}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ArrowUpDown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium">Custo/Kg</p>
                  <p className="text-white text-lg font-bold truncate">{formatCurrency(galvanicaStats.custoMedioKg)}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium">Pendentes</p>
                  <p className="text-white text-lg font-bold">{galvanicaStats.enviosPendentes}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium">Retornados</p>
                  <p className="text-white text-lg font-bold">{galvanicaStats.enviosRetornados}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Evolução de Custos */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-display">Evolução de Custos Galvânica</CardTitle>
              </CardHeader>
              <CardContent>
                {galvanicaEvolutionData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={galvanicaEvolutionData}>
                        <defs>
                          <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(220 70% 50%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(220 70% 50%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [
                            name === 'custo' ? formatCurrency(value) : `${value}g`,
                            name === 'custo' ? 'Custo' : 'Peso'
                          ]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="custo"
                          name="Custo"
                          stroke="hsl(220 70% 50%)"
                          strokeWidth={2}
                          fill="url(#colorCusto)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    Nenhum dado de galvânica no período selecionado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Pie Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Status dos Envios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={galvanicaStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {galvanicaStatusData.map((entry, index) => (
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
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha de gráficos */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Custo por Tipo de Banho */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Custo por Tipo de Banho</CardTitle>
              </CardHeader>
              <CardContent>
                {galvanicaPorBanhoData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={galvanicaPorBanhoData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                        <YAxis 
                          dataKey="nome" 
                          type="category" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          width={100}
                          tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Custo']}
                        />
                        <Bar dataKey="custo" fill="hsl(38 70% 50%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    Nenhum dado de banhos no período
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evolução Mensal */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Evolução Mensal (Últimos 12 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                {galvanicaMensalData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={galvanicaMensalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number, name: string) => [
                            name === 'custo' ? formatCurrency(value) : `${value}g`,
                            name === 'custo' ? 'Custo Total' : 'Peso Total'
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="custo"
                          name="Custo Total"
                          stroke="hsl(160 60% 40%)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    Nenhum dado mensal disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalhes */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display">Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Média por Envio</p>
                  <p className="text-2xl font-display font-semibold text-primary">
                    {formatCurrency(galvanicaStats.totalEnvios > 0 ? galvanicaStats.custoTotal / galvanicaStats.totalEnvios : 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Peso Médio/Envio</p>
                  <p className="text-2xl font-display font-semibold">
                    {(galvanicaStats.totalEnvios > 0 ? galvanicaStats.pesoTotal / galvanicaStats.totalEnvios : 0).toFixed(1)}g
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Taxa de Retorno</p>
                  <p className="text-2xl font-display font-semibold text-emerald-500">
                    {galvanicaStats.totalEnvios > 0 ? ((galvanicaStats.enviosRetornados / galvanicaStats.totalEnvios) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Tipos de Banho</p>
                  <p className="text-2xl font-display font-semibold">{galvanicaPorBanhoData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Stock by Category */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Estoque por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoriaData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(38 70% 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stock Status */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Status do Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estoqueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {estoqueData.map((entry, index) => (
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
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {estoqueData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value} peças</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revendedoras" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Resellers */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Top Revendedoras</CardTitle>
              </CardHeader>
              <CardContent>
                {topRevendedoras.length > 0 ? (
                  <div className="space-y-4">
                    {topRevendedoras.map((rev, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <span className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                          index === 0 && 'gold-gradient text-primary-foreground',
                          index === 1 && 'bg-muted-foreground/20 text-muted-foreground',
                          index === 2 && 'bg-accent/30 text-accent-foreground',
                          index > 2 && 'bg-secondary text-secondary-foreground'
                        )}>
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{rev.nome}</p>
                          <p className="text-xs text-muted-foreground">{rev.vendas} vendas</p>
                        </div>
                        <span className="font-semibold">{formatCurrency(rev.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Nenhuma venda de revendedora confirmada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reseller Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Resumo Revendedoras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">Total de Revendedoras Ativas</p>
                    <p className="text-2xl font-display font-semibold">{revendedoras.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">Romaneios Pendentes</p>
                    <p className="text-2xl font-display font-semibold text-warning">{stats.romaneiosPendentes}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">Comissões a Pagar (estimado)</p>
                    <p className="text-2xl font-display font-semibold text-primary">{formatCurrency(stats.comissaoTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Builder Modal */}
      <ExportBuilder
        open={isExportBuilderOpen}
        onOpenChange={setIsExportBuilderOpen}
        vendas={vendas}
        pecas={pecas}
        revendedoras={revendedoras}
        romaneios={romaneios}
        clientes={clientes}
      />

      {/* Replenishment Report Modal */}
      <ReplenishmentReport
        open={isReplenishmentOpen}
        onOpenChange={setIsReplenishmentOpen}
        pecas={pecas}
        fornecedores={fornecedores}
      />
    </div>
  );
}
