import { memo } from 'react';
import { Activity, ShoppingCart, FileText, Clock, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Venda, Romaneio } from '@/hooks/useSupabaseData';

interface RecentActivityCardProps {
  vendas: Venda[];
  romaneios: Romaneio[];
}

interface ActivityItem {
  id: string;
  type: 'venda' | 'romaneio';
  title: string;
  subtitle: string;
  value: number;
  date: Date;
  status?: string;
}

export const RecentActivityCard = memo(function RecentActivityCard({ vendas, romaneios }: RecentActivityCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Combine and sort activities with null safety
  const safeVendas = vendas || [];
  const safeRomaneios = romaneios || [];
  
  const activities: ActivityItem[] = [
    ...safeVendas.slice(0, 5).map(v => ({
      id: v?.id || '',
      type: 'venda' as const,
      title: 'Venda PDV',
      subtitle: v?.cliente_id ? `Cliente #${v.cliente_id.slice(-4)}` : 'Cliente não identificado',
      value: Number(v?.valor_total || 0),
      date: new Date(v?.created_at || Date.now()),
    })),
    ...safeRomaneios.slice(0, 5).map(r => ({
      id: r?.id || '',
      type: 'romaneio' as const,
      title: 'Venda Revendedora',
      subtitle: r?.revendedora_nome || r?.reseller_nome || 'Sem nome',
      value: Number(r?.total || 0),
      date: new Date(r?.created_at || Date.now()),
      status: r?.status,
    })),
  ]
    .filter(a => a.id)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  const getActivityStyles = (type: 'venda' | 'romaneio') => {
    return type === 'venda' 
      ? { icon: ShoppingCart, bg: 'bg-white/20', color: 'text-white' }
      : { icon: FileText, bg: 'bg-white/20', color: 'text-white' };
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Decorative wave pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg 
          className="absolute bottom-0 left-0 right-0 w-full h-24 opacity-40"
          viewBox="0 0 400 100" 
          preserveAspectRatio="none"
        >
          <path
            d="M0 60 C 80 40, 120 80, 200 50 C 280 20, 320 70, 400 40 L 400 100 L 0 100 Z"
            fill="rgba(255,255,255,0.15)"
          />
          <path
            d="M0 75 C 60 60, 140 90, 200 65 C 260 40, 340 85, 400 55 L 400 100 L 0 100 Z"
            fill="rgba(255,255,255,0.15)"
          />
        </svg>
      </div>

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Atividade Recente</h3>
            <p className="text-xs text-white/60">Últimas movimentações</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative space-y-2">
        {activities.length > 0 ? (
          activities.map((activity) => {
            const styles = getActivityStyles(activity.type);
            const Icon = styles.icon;
            return (
              <div 
                key={`${activity.type}-${activity.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", styles.bg)}>
                  <Icon className={cn("w-4 h-4", styles.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                    {activity.status === 'pendente' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-medium">
                        Pendente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 truncate">{activity.subtitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-white">{formatCurrency(activity.value)}</p>
                  <p className="text-[10px] text-white/60 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(activity.date, { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <Activity className="w-10 h-10 mx-auto mb-2 text-white/30" />
            <p className="text-sm text-white/60">Nenhuma atividade recente</p>
          </div>
        )}
      </div>
    </div>
  );
});