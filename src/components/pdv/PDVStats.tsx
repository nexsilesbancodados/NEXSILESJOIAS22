import { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Clock,
  Target,
  Banknote
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  gradient: string;
  isHighlight?: boolean;
  progressBar?: number;
}

function StatCard({ icon, label, value, gradient, isHighlight, progressBar }: StatCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-4 shadow-lg min-w-[150px] w-[150px] flex-shrink-0',
      gradient,
      isHighlight && 'ring-2 ring-white/30'
    )}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
        <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
      </div>
      <div className="relative z-10 flex flex-col gap-2">
        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className={cn(
            "text-xs font-medium",
            isHighlight ? "text-white/90 font-semibold uppercase tracking-wide" : "text-white/80"
          )}>
            {label}
          </p>
          <p className="text-white text-lg font-bold leading-tight">{value}</p>
        </div>
        {progressBar !== undefined && (
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.min(100, progressBar)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function PDVStats({
  vendasCaixa,
  movimentosCaixa,
  fundoTroco,
  horaAbertura,
  metaDiaria = 5000,
}: PDVStatsProps) {
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
    <div className="w-full overflow-x-auto pb-2 mb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      <div className="flex gap-3 min-w-max px-1">
        <StatCard
          icon={<Banknote className="w-5 h-5 text-white" />}
          label="Saldo Caixa"
          value={formatCurrency(stats.saldoAtual)}
          gradient="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700"
          isHighlight
        />

        <StatCard
          icon={<DollarSign className="w-5 h-5 text-white" />}
          label="Total Vendas"
          value={formatCurrency(stats.totalVendas)}
          gradient={gradientStyles.purple}
        />

        <StatCard
          icon={<ShoppingBag className="w-5 h-5 text-white" />}
          label="Qtd. Vendas"
          value={stats.qtdVendas}
          gradient={gradientStyles.green}
        />

        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          label="Ticket Médio"
          value={formatCurrency(stats.ticketMedio)}
          gradient={gradientStyles.blue}
        />

        <StatCard
          icon={<Users className="w-5 h-5 text-white" />}
          label="Clientes ID"
          value={`${stats.clientesIdentificados}/${stats.qtdVendas}`}
          gradient={gradientStyles.pink}
        />

        <StatCard
          icon={<Clock className="w-5 h-5 text-white" />}
          label="Tempo Aberto"
          value={`${stats.horasAberto}h ${stats.minutosAberto}m`}
          gradient={gradientStyles.orange}
        />

        <StatCard
          icon={<Target className="w-5 h-5 text-white" />}
          label="Meta Diária"
          value={`${Math.min(100, Math.round(stats.progressoMeta))}%`}
          gradient={gradientStyles.teal}
          progressBar={stats.progressoMeta}
        />
      </div>
    </div>
  );
}
