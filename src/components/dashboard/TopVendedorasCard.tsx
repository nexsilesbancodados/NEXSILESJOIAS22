import { memo, useMemo } from 'react';
import { Trophy, Medal, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Romaneio } from '@/hooks/useSupabaseData';

interface TopVendedorasCardProps {
  romaneios: Romaneio[];
}

export const TopVendedorasCard = memo(function TopVendedorasCard({ romaneios }: TopVendedorasCardProps) {
  // Calculate sales by reseller - memoized with null safety
  const { topVendedoras, maxTotal } = useMemo(() => {
    const safeRomaneios = romaneios || [];
    const vendasPorRevendedora = safeRomaneios
      .filter(r => r?.status === 'confirmado' && r?.reseller_id)
      .reduce((acc, r) => {
        if (!r) return acc;
        const resellerId = r.reseller_id!;
        const resellerNome = r.revendedora_nome || r.reseller_nome || 'Sem nome';
        if (!acc[resellerId]) {
          acc[resellerId] = {
            nome: resellerNome,
            total: 0,
            quantidade: 0,
          };
        }
        acc[resellerId].total += Number(r.total || 0);
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

  const getMedalStyles = (index: number) => {
    if (index === 0) return 'bg-white/30 text-white';
    if (index === 1) return 'bg-white/20 text-white/90';
    if (index === 2) return 'bg-white/15 text-white/80';
    return 'bg-white/10 text-white/70';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-lg">
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
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Top Revendedoras</h3>
            <p className="text-xs text-white/60">Ranking por faturamento</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative space-y-2">
        {topVendedoras.length > 0 ? (
          topVendedoras.map((vendedora, index) => {
            const percentage = (vendedora.total / maxTotal) * 100;
            
            return (
              <div key={index} className="p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", getMedalStyles(index))}>
                    {index < 3 ? (
                      index === 0 ? <Trophy className="w-4 h-4" /> : <Medal className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
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
            <p className="text-sm text-white/60">Nenhuma venda confirmada ainda</p>
          </div>
        )}
      </div>
    </div>
  );
});