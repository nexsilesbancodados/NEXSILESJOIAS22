import { memo, useMemo } from 'react';
import { Trophy, Medal } from 'lucide-react';
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

  const getMedalIcon = (index: number) => {
    if (index === 0) return Trophy;
    return Medal;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 p-5 shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Top Revendedoras</h3>
            <p className="text-sm text-white/70">Ranking por faturamento</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {topVendedoras.length > 0 ? (
            topVendedoras.map((vendedora, index) => {
              const MedalIcon = getMedalIcon(index);
              const percentage = (vendedora.total / maxTotal) * 100;
              
              return (
                <div key={index} className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      {index < 3 ? (
                        <MedalIcon className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-sm font-medium text-white">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{vendedora.nome}</p>
                      <p className="text-xs text-white/60">
                        {vendedora.quantidade} venda{vendedora.quantidade > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(vendedora.total)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-white/60 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-white/30" />
              <p className="text-sm text-white/70">Nenhuma venda confirmada ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});