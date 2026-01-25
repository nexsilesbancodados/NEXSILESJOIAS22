import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, TrendingDown, Calendar, ArrowUpRight } from 'lucide-react';
import { useMetaAtual } from '@/hooks/useMetas';
import { useVendas } from '@/hooks/useSupabaseData';

export function MetaProgress() {
  const { data: metaAtual } = useMetaAtual();
  const { data: vendas = [] } = useVendas();

  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  // Ensure vendas is always an array
  const safeVendas = vendas || [];

  // Calculate current month sales with null safety
  const vendasMesAtual = safeVendas.filter(venda => {
    if (!venda?.created_at) return false;
    const dataVenda = new Date(venda.created_at);
    return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual;
  });
  
  const faturamentoMesAtual = vendasMesAtual.reduce((acc, v) => acc + Number(v?.total || 0), 0);

  // Calculate previous month sales with null safety
  const vendasMesAnterior = safeVendas.filter(venda => {
    if (!venda?.created_at) return false;
    const dataVenda = new Date(venda.created_at);
    return dataVenda.getMonth() === mesAnterior && dataVenda.getFullYear() === anoMesAnterior;
  });
  
  const faturamentoMesAnterior = vendasMesAnterior.reduce((acc, v) => acc + Number(v?.total || 0), 0);

  // Calculate percentage change
  const variacaoPercentual = faturamentoMesAnterior > 0
    ? ((faturamentoMesAtual - faturamentoMesAnterior) / faturamentoMesAnterior) * 100
    : 0;

  // Calculate progress towards goal
  const valorMeta = metaAtual?.valor || 0;
  const progressoMeta = valorMeta > 0 ? (faturamentoMesAtual / valorMeta) * 100 : 0;

  // Days remaining in month
  const hoje = new Date();
  const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const diasRestantes = ultimoDiaMes - hoje.getDate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getNomeMes = (mes: number) => {
    return new Date(2024, mes, 1).toLocaleDateString('pt-BR', { month: 'long' });
  };

  if (!metaAtual) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Target className="w-5 h-5 text-muted-foreground" />
          </div>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        <h3 className="font-semibold text-foreground mb-1">Meta do Mês</h3>
        <p className="text-sm text-muted-foreground">
          Nenhuma meta definida para {getNomeMes(mesAtual)}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
          <Target className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">
            {Math.min(progressoMeta, 100).toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-foreground mb-1">Meta de {getNomeMes(mesAtual)}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {formatCurrency(faturamentoMesAtual)} de {formatCurrency(valorMeta)}
      </p>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progressoMeta, 100)}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          {variacaoPercentual >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-destructive" />
          )}
          <span className={variacaoPercentual >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-destructive font-medium'}>
            {variacaoPercentual >= 0 ? '+' : ''}{variacaoPercentual.toFixed(1)}%
          </span>
          <span className="text-muted-foreground text-xs">vs anterior</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 justify-end">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground text-xs">
            {diasRestantes} dias restantes
          </span>
        </div>
      </div>

      {progressoMeta >= 100 && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">🎉 Meta atingida!</p>
        </div>
      )}
    </div>
  );
}
