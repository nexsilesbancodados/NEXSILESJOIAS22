import { memo } from 'react';
import {
  ShoppingBag, 
  Percent, 
  Calendar,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Venda {
  created_at: string;
  total: number;
}

interface QuickStatsRowProps {
  vendas: Venda[];
  romaneios: { total: number; status: string; created_at: string }[];
}

const gradientStyles = [
  'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
  'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
  'bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600',
  'bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600',
];

export const QuickStatsRow = memo(function QuickStatsRow({ vendas, romaneios }: QuickStatsRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  const now = new Date();
  const today = now.toDateString();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  
  // Today's sales
  const vendasHoje = vendas.filter(v => new Date(v.created_at).toDateString() === today);
  const totalHoje = vendasHoje.reduce((acc, v) => acc + Number(v.total), 0);

  // This week's sales
  const vendasSemana = vendas.filter(v => new Date(v.created_at) >= thisWeekStart);
  const totalSemana = vendasSemana.reduce((acc, v) => acc + Number(v.total), 0);

  // Conversion rate (example: confirmed romaneios / total romaneios)
  const romaneiosConfirmados = romaneios.filter(r => r.status === 'confirmado').length;
  const taxaConversao = romaneios.length > 0 
    ? ((romaneiosConfirmados / romaneios.length) * 100).toFixed(0) 
    : '0';

  // Average daily sales (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const vendasUltimos30Dias = vendas.filter(v => new Date(v.created_at) >= thirtyDaysAgo);
  const mediaDiaria = vendasUltimos30Dias.length > 0 
    ? vendasUltimos30Dias.reduce((acc, v) => acc + Number(v.total), 0) / 30 
    : 0;

  const stats = [
    {
      label: 'Vendas Hoje',
      value: formatCurrency(totalHoje),
      icon: ShoppingBag,
      subtext: `${vendasHoje.length} vendas`,
    },
    {
      label: 'Esta Semana',
      value: formatCurrency(totalSemana),
      icon: Calendar,
      subtext: `${vendasSemana.length} vendas`,
    },
    {
      label: 'Média Diária',
      value: formatCurrency(mediaDiaria),
      icon: Target,
      subtext: 'Últimos 30 dias',
    },
    {
      label: 'Taxa de Confirmação',
      value: `${taxaConversao}%`,
      icon: Percent,
      subtext: 'Romaneios confirmados',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
            gradientStyles[index]
          )}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
          </div>
          
          <div className="relative z-10 flex items-center gap-4">
            {/* Icon container */}
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <p className="text-white/80 text-sm font-medium">{stat.label}</p>
              <p className="text-white text-2xl font-bold tracking-tight">{stat.value}</p>
              {stat.subtext && (
                <p className="text-white/60 text-xs mt-0.5">{stat.subtext}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});