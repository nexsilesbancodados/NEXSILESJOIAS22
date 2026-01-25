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

  const getActivityStyles = (type: 'venda' | 'romaneio') => {
    return type === 'venda' 
      ? { icon: ShoppingCart, bg: 'bg-emerald-50 dark:bg-emerald-900/30', color: 'text-emerald-500' }
      : { icon: FileText, bg: 'bg-blue-50 dark:bg-blue-900/30', color: 'text-blue-500' };
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Atividade Recente</h3>
            <p className="text-xs text-muted-foreground">Últimas movimentações</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        {activities.length > 0 ? (
          activities.map((activity) => {
            const styles = getActivityStyles(activity.type);
            const Icon = styles.icon;
            return (
              <div 
                key={`${activity.type}-${activity.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", styles.bg)}>
                  <Icon className={cn("w-4 h-4", styles.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                    {activity.status === 'pendente' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                        Pendente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(activity.value)}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(activity.date, { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <Activity className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
          </div>
        )}
      </div>
    </div>
  );
});
