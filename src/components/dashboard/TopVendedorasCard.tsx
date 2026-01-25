import { memo, useMemo } from 'react';
import { Trophy, Medal, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Romaneio } from '@/hooks/useSupabaseData';

interface TopVendedorasCardProps {
  romaneios: Romaneio[];
}

export const TopVendedorasCard = memo(function TopVendedorasCard({ romaneios }: TopVendedorasCardProps) {
  // Calculate sales by reseller - memoized
  const { topVendedoras, maxTotal } = useMemo(() => {
    const vendasPorRevendedora = romaneios
      .filter(r => r.status === 'confirmado' && r.reseller_id)
      .reduce((acc, r) => {
        const resellerId = r.reseller_id!;
        const resellerNome = r.revendedora_nome || r.reseller_nome || 'Sem nome';
        if (!acc[resellerId]) {
          acc[resellerId] = {
            nome: resellerNome,
            total: 0,
            quantidade: 0,
          };
        }
        acc[resellerId].total += Number(r.total);
        acc[resellerId].quantidade += 1;
        return acc;
      }, {} as Record<string, { nome: string; total: number; quantidade: number }>);

    const sorted = Object.values(vendasPorRevendedora)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    return {
      topVendedoras: sorted,
      maxTotal: sorted[0]?.total || 1
    };
  }, [romaneios]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/30';
    if (index === 1) return 'text-slate-400 bg-slate-50 dark:bg-slate-900/30';
    if (index === 2) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Top Revendedoras</h3>
            <p className="text-xs text-muted-foreground">Ranking por faturamento</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        {topVendedoras.length > 0 ? (
          topVendedoras.map((vendedora, index) => {
            const percentage = (vendedora.total / maxTotal) * 100;
            
            return (
              <div key={index} className="p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", getMedalColor(index))}>
                    {index < 3 ? (
                      index === 0 ? <Trophy className="w-4 h-4" /> : <Medal className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{vendedora.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendedora.quantidade} venda{vendedora.quantidade > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(vendedora.total)}</p>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <Trophy className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma venda confirmada ainda</p>
          </div>
        )}
      </div>
    </div>
  );
});
