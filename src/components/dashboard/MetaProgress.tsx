import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useMetaAtual } from '@/hooks/useMetas';
import { useVendas } from '@/hooks/useSupabaseData';

export function MetaProgress() {
  const { data: metaAtual } = useMetaAtual();
  const { data: vendas = [] } = useVendas();

  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  // Calculate current month sales
  const vendasMesAtual = vendas.filter(venda => {
    const dataVenda = new Date(venda.created_at);
    return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual;
  });
  
  const faturamentoMesAtual = vendasMesAtual.reduce((acc, v) => acc + Number(v.total), 0);

  // Calculate previous month sales
  const vendasMesAnterior = vendas.filter(venda => {
    const dataVenda = new Date(venda.created_at);
    return dataVenda.getMonth() === mesAnterior && dataVenda.getFullYear() === anoMesAnterior;
  });
  
  const faturamentoMesAnterior = vendasMesAnterior.reduce((acc, v) => acc + Number(v.total), 0);

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 p-5 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Meta do Mês</h3>
            <p className="text-sm text-white/70">
              Nenhuma meta definida para {getNomeMes(mesAtual)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 p-5 shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Meta de {getNomeMes(mesAtual)}</h3>
              <p className="text-sm text-white/70">
                {formatCurrency(faturamentoMesAtual)} de {formatCurrency(valorMeta)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {Math.min(progressoMeta, 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-white/80 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressoMeta, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
            {variacaoPercentual >= 0 ? (
              <TrendingUp className="w-4 h-4 text-white" />
            ) : (
              <TrendingDown className="w-4 h-4 text-white" />
            )}
            <span className="text-white font-medium">
              {variacaoPercentual >= 0 ? '+' : ''}{variacaoPercentual.toFixed(1)}%
            </span>
            <span className="text-white/70 text-xs">vs anterior</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/10 backdrop-blur-sm justify-end">
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-white/70 text-xs">
              {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'} restantes
            </span>
          </div>
        </div>

        {progressoMeta >= 100 && (
          <div className="mt-4 p-3 bg-white/20 backdrop-blur-sm rounded-lg text-center">
            <p className="text-white font-medium">🎉 Meta atingida!</p>
          </div>
        )}
      </div>
    </div>
  );
}