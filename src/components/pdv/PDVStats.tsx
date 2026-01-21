import { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Clock,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Venda, MovimentoCaixa } from '@/hooks/useSupabaseData';

interface PDVStatsProps {
  vendasCaixa: Venda[];
  movimentosCaixa: MovimentoCaixa[];
  fundoTroco: number;
  horaAbertura: string;
  metaDiaria?: number;
}

const gradientStyles = {
  purple: 'bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600',
  green: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
  orange: 'bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600',
  blue: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
  teal: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500',
  pink: 'bg-gradient-to-br from-pink-400 via-rose-500 to-red-500',
};

export function PDVStats({
  vendasCaixa,
  movimentosCaixa,
  fundoTroco,
  horaAbertura,
  metaDiaria = 5000,
}: PDVStatsProps) {
  const stats = useMemo(() => {
    const totalVendas = vendasCaixa.reduce((acc, v) => acc + Number(v.total), 0);
    const qtdVendas = vendasCaixa.length;
    const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;
    const clientesIdentificados = vendasCaixa.filter(v => v.cliente_nome).length;
    
    const sangrias = movimentosCaixa
      .filter(m => m.tipo === 'sangria')
      .reduce((acc, s) => acc + Number(s.valor), 0);
    const suprimentos = movimentosCaixa
      .filter(m => m.tipo === 'suprimento')
      .reduce((acc, s) => acc + Number(s.valor), 0);
    
    const saldoAtual = fundoTroco + totalVendas + suprimentos - sangrias;
    const progressoMeta = (totalVendas / metaDiaria) * 100;

    // Calculate time open
    const horasAberto = Math.floor((Date.now() - new Date(horaAbertura).getTime()) / (1000 * 60 * 60));
    const minutosAberto = Math.floor((Date.now() - new Date(horaAbertura).getTime()) / (1000 * 60)) % 60;

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
    };
  }, [vendasCaixa, movimentosCaixa, fundoTroco, horaAbertura, metaDiaria]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {/* Total Vendas */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-4 shadow-lg',
        gradientStyles.purple
      )}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium">Total Vendas</p>
            <p className="text-white text-lg font-bold truncate">{formatCurrency(stats.totalVendas)}</p>
          </div>
        </div>
      </div>

      {/* Qtd. Vendas */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-4 shadow-lg',
        gradientStyles.green
      )}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium">Qtd. Vendas</p>
            <p className="text-white text-lg font-bold">{stats.qtdVendas}</p>
          </div>
        </div>
      </div>

      {/* Ticket Médio */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-4 shadow-lg',
        gradientStyles.blue
      )}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
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

      {/* Clientes ID */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-4 shadow-lg',
        gradientStyles.pink
      )}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium">Clientes ID</p>
            <p className="text-white text-lg font-bold">{stats.clientesIdentificados}/{stats.qtdVendas}</p>
          </div>
        </div>
      </div>

      {/* Tempo Aberto */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-4 shadow-lg',
        gradientStyles.orange
      )}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium">Tempo Aberto</p>
            <p className="text-white text-lg font-bold">{stats.horasAberto}h {stats.minutosAberto}m</p>
          </div>
        </div>
      </div>

      {/* Meta Diária */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-4 shadow-lg',
        gradientStyles.teal
      )}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">Meta Diária</p>
              <p className="text-white text-lg font-bold">
                {Math.min(100, Math.round(stats.progressoMeta))}%
              </p>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.min(100, stats.progressoMeta)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
