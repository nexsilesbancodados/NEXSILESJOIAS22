import { memo } from 'react';
import { Activity, ShoppingCart, FileText, Clock } from 'lucide-react';
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

  // Combine and sort activities
  const activities: ActivityItem[] = [
    ...vendas.slice(0, 5).map(v => ({
      id: v.id,
      type: 'venda' as const,
      title: 'Venda PDV',
      subtitle: v.cliente_nome || 'Cliente não identificado',
      value: Number(v.total),
      date: new Date(v.created_at),
    })),
    ...romaneios.slice(0, 5).map(r => ({
      id: r.id,
      type: 'romaneio' as const,
      title: 'Venda Revendedora',
      subtitle: r.revendedora_nome || r.reseller_nome || 'Sem nome',
      value: Number(r.total),
      date: new Date(r.created_at),
      status: r.status,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  const getActivityIcon = (type: 'venda' | 'romaneio') => {
    return type === 'venda' ? ShoppingCart : FileText;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-5 shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Atividade Recente</h3>
            <p className="text-sm text-white/70">Últimas movimentações</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div 
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
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
              <p className="text-sm text-white/70">Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});