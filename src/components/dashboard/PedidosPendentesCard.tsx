import { memo } from 'react';
import { ShoppingBag, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { pendentes: 0, confirmados: 0, cancelados: 0, total: 0 };
      
      // First get user's catalogs
      const { data: userCatalogos } = await supabase
        .from('catalogos')
        .select('id')
        .eq('user_id', user.id);
      
      const catalogoIds = userCatalogos?.map(c => c.id) || [];
      if (catalogoIds.length === 0) {
        return { pendentes: 0, confirmados: 0, cancelados: 0, total: 0 };
      }
      
      // Then get orders from those catalogs
      const { data, error } = await supabase
        .from('pedidos_catalogo')
        .select('status')
        .in('catalogo_id', catalogoIds);
      
      if (error) throw error;
      
      const pedidos = data || [];
      return {
        pendentes: pedidos.filter(p => p.status === 'pendente').length,
        confirmados: pedidos.filter(p => p.status === 'confirmado').length,
        cancelados: pedidos.filter(p => p.status === 'cancelado').length,
        total: pedidos.length,
      } as PedidoStats;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const formatNumber = (num: number) => num.toLocaleString('pt-BR');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 p-5 shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pedidos do Catálogo</h3>
            <p className="text-sm text-white/70">
              {formatNumber(stats?.total || 0)} pedidos recebidos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-xl font-bold text-white">{stats?.pendentes || 0}</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">Pendentes</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle className="w-4 h-4 text-white" />
              <span className="text-xl font-bold text-white">{stats?.confirmados || 0}</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">Confirmados</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <XCircle className="w-4 h-4 text-white" />
              <span className="text-xl font-bold text-white">{stats?.cancelados || 0}</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">Cancelados</p>
          </div>
        </div>
      </div>
    </div>
  );
});