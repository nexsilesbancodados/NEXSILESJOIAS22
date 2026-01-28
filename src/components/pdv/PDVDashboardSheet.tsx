import { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock,
  Target,
  Banknote,
  CreditCard,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Venda, MovimentoCaixa } from '@/hooks/useSupabaseData';

interface PDVDashboardSheetProps {
  vendasCaixa: Venda[];
  movimentosCaixa: MovimentoCaixa[];
  fundoTroco: number;
  horaAbertura: string;
  metaDiaria?: number;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  gradient,
  trend
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  subValue?: string;
  gradient: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl p-4 shadow-lg',
      gradient
    )}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/20" />
      </div>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-white/80 text-xs font-medium mb-1">{label}</p>
          <p className="text-white text-xl font-bold">{value}</p>
          {subValue && (
            <p className="text-white/70 text-xs mt-0.5">{subValue}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <span className={cn(
              "text-xs font-medium flex items-center gap-0.5",
              trend === 'up' ? 'text-white' : 'text-white/70'
            )}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStatRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

export function PDVDashboardSheet({
  vendasCaixa,
  movimentosCaixa,
  fundoTroco,
  horaAbertura,
  metaDiaria = 5000,
}: PDVDashboardSheetProps) {
  const stats = useMemo(() => {
    const safeVendas = vendasCaixa || [];
    const safeMovimentos = movimentosCaixa || [];
    
    const totalVendas = safeVendas.reduce((acc, v) => acc + Number(v?.valor_total || 0), 0);
    const qtdVendas = safeVendas.length;
    const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;
    const clientesIdentificados = safeVendas.filter(v => v?.cliente_id).length;
    
    const sangrias = safeMovimentos
      .filter(m => m?.tipo === 'sangria')
      .reduce((acc, s) => acc + Number(s?.valor || 0), 0);
    const suprimentos = safeMovimentos
      .filter(m => m?.tipo === 'suprimento')
      .reduce((acc, s) => acc + Number(s?.valor || 0), 0);
    
    const saldoAtual = fundoTroco + totalVendas + suprimentos - sangrias;
    const progressoMeta = (totalVendas / metaDiaria) * 100;

    // Calculate time open
    const msAberto = horaAbertura ? Date.now() - new Date(horaAbertura).getTime() : 0;
    const horasAberto = Math.floor(msAberto / (1000 * 60 * 60));
    const minutosAberto = Math.floor(msAberto / (1000 * 60)) % 60;

    // Payment methods breakdown
    const porFormaPagamento = safeVendas.reduce((acc, v) => {
      const forma = v.forma_pagamento || 'outros';
      acc[forma] = (acc[forma] || 0) + Number(v.valor_total || 0);
      return acc;
    }, {} as Record<string, number>);

    // Hourly distribution
    const porHora = safeVendas.reduce((acc, v) => {
      const hora = new Date(v.created_at || '').getHours();
      acc[hora] = (acc[hora] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const horasPico = Object.entries(porHora)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hora]) => `${hora}h`);

    return {
      totalVendas,
      qtdVendas,
      ticketMedio,
      clientesIdentificados,
      sangrias,
      suprimentos,
      saldoAtual,
      progressoMeta,
      horasAberto,
      minutosAberto,
      fundoTroco,
      porFormaPagamento,
      horasPico,
    };
  }, [vendasCaixa, movimentosCaixa, fundoTroco, horaAbertura, metaDiaria]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Dashboard do Caixa
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-4">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Banknote}
                label="Saldo em Caixa"
                value={formatCurrency(stats.saldoAtual)}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
              <StatCard
                icon={DollarSign}
                label="Total Vendido"
                value={formatCurrency(stats.totalVendas)}
                subValue={`${stats.qtdVendas} vendas`}
                gradient="bg-gradient-to-br from-violet-500 to-purple-600"
              />
              <StatCard
                icon={TrendingUp}
                label="Ticket Médio"
                value={formatCurrency(stats.ticketMedio)}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              />
              <StatCard
                icon={Target}
                label="Meta Diária"
                value={`${Math.min(100, Math.round(stats.progressoMeta))}%`}
                subValue={formatCurrency(metaDiaria)}
                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              />
            </div>

            {/* Meta Progress Bar */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso da Meta</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(stats.totalVendas)} / {formatCurrency(metaDiaria)}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    stats.progressoMeta >= 100 
                      ? "bg-gradient-to-r from-emerald-500 to-green-400" 
                      : "bg-gradient-to-r from-primary to-primary/70"
                  )}
                  style={{ width: `${Math.min(100, stats.progressoMeta)}%` }}
                />
              </div>
              {stats.progressoMeta >= 100 && (
                <p className="text-xs text-success mt-2 font-medium">🎉 Meta atingida!</p>
              )}
            </div>

            {/* Session Info */}
            <div className="rounded-xl border bg-card p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Informações da Sessão
              </h4>
              <MiniStatRow label="Tempo aberto" value={`${stats.horasAberto}h ${stats.minutosAberto}m`} />
              <MiniStatRow label="Fundo de troco" value={formatCurrency(stats.fundoTroco)} />
              <MiniStatRow label="Suprimentos" value={formatCurrency(stats.suprimentos)} icon={ArrowDownRight} />
              <MiniStatRow label="Sangrias" value={formatCurrency(stats.sangrias)} icon={ArrowUpRight} />
            </div>

            {/* Payment Methods Breakdown */}
            <div className="rounded-xl border bg-card p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                Formas de Pagamento
              </h4>
              {Object.entries(stats.porFormaPagamento).length > 0 ? (
                Object.entries(stats.porFormaPagamento).map(([forma, valor]) => {
                  const icons: Record<string, React.ElementType> = {
                    dinheiro: Banknote,
                    pix: Smartphone,
                    credito: CreditCard,
                    debito: CreditCard,
                  };
                  const Icon = icons[forma] || Receipt;
                  const labels: Record<string, string> = {
                    dinheiro: 'Dinheiro',
                    pix: 'PIX',
                    credito: 'Crédito',
                    debito: 'Débito',
                  };
                  return (
                    <MiniStatRow 
                      key={forma} 
                      label={labels[forma] || forma} 
                      value={formatCurrency(valor)} 
                      icon={Icon}
                    />
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">Nenhuma venda registrada</p>
              )}
            </div>

            {/* Customer Stats */}
            <div className="rounded-xl border bg-card p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Clientes
              </h4>
              <MiniStatRow 
                label="Clientes identificados" 
                value={`${stats.clientesIdentificados} de ${stats.qtdVendas}`} 
              />
              <MiniStatRow 
                label="Taxa de identificação" 
                value={stats.qtdVendas > 0 ? `${Math.round((stats.clientesIdentificados / stats.qtdVendas) * 100)}%` : '0%'} 
              />
              {stats.horasPico.length > 0 && (
                <MiniStatRow 
                  label="Horários de pico" 
                  value={stats.horasPico.join(', ')} 
                />
              )}
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border bg-card p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                Resumo de Vendas
              </h4>
              <MiniStatRow label="Total de vendas" value={String(stats.qtdVendas)} />
              <MiniStatRow label="Valor total" value={formatCurrency(stats.totalVendas)} />
              <MiniStatRow label="Ticket médio" value={formatCurrency(stats.ticketMedio)} />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
