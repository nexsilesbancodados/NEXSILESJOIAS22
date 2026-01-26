import { memo } from 'react';
import { ShoppingBag, Clock, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';

const db = supabase;

interface PedidoStats {
  pendentes: number;
  confirmados: number;
  cancelados: number;
  total: number;
}

export const PedidosPendentesCard = memo(function PedidosPendentesCard() {
  const { data: stats } = useQuery({
    queryKey: ['pedidos-stats'],
    queryFn: async () => {
      // Get all catalogs (table doesn't have user_id column)
      const { data: allCatalogos } = await db.from('catalogos').select('id');
      const catalogoIds = allCatalogos?.map((c: any) => c.id) || [];
      if (catalogoIds.length === 0) return { pendentes: 0, confirmados: 0, cancelados: 0, total: 0 };
      
      const { data, error } = await db.from('pedidos_catalogo').select('status').in('catalogo_id', catalogoIds);
      if (error) throw error;
      
      const pedidos = data || [];
      return {
        pendentes: pedidos.filter(p => p.status === 'pendente').length,
        confirmados: pedidos.filter(p => p.status === 'confirmado').length,
        cancelados: pedidos.filter(p => p.status === 'cancelado').length,
        total: pedidos.length,
      } as PedidoStats;
    },
    staleTime: 1000 * 60 * 2,
  });

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-lg">
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

      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Pedidos Catálogo</h3>
            <p className="text-xs text-white/60">{stats?.total || 0} pedidos</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <div className="bg-white/20 border border-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-xl font-bold text-white">{stats?.pendentes || 0}</span>
          </div>
          <p className="text-[10px] text-white/70 font-medium">Pendentes</p>
        </div>
        
        <div className="bg-white/20 border border-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle className="w-4 h-4 text-white" />
            <span className="text-xl font-bold text-white">{stats?.confirmados || 0}</span>
          </div>
          <p className="text-[10px] text-white/70 font-medium">Confirmados</p>
        </div>
        
        <div className="bg-white/20 border border-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <XCircle className="w-4 h-4 text-white" />
            <span className="text-xl font-bold text-white">{stats?.cancelados || 0}</span>
          </div>
          <p className="text-[10px] text-white/70 font-medium">Cancelados</p>
        </div>
      </div>
    </div>
  );
});