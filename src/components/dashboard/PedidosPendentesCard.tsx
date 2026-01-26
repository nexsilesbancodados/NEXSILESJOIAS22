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
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Pedidos Catálogo</h3>
            <p className="text-xs text-muted-foreground">{stats?.total || 0} pedidos</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xl font-bold text-foreground">{stats?.pendentes || 0}</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">Pendentes</p>
        </div>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xl font-bold text-foreground">{stats?.confirmados || 0}</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">Confirmados</p>
        </div>
        
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span className="text-xl font-bold text-foreground">{stats?.cancelados || 0}</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">Cancelados</p>
        </div>
      </div>
    </div>
  );
});
