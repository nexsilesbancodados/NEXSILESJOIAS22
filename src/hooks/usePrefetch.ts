import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase-db';

/**
 * Prefetch critical data on app initialization for faster page loads
 */
export function usePrefetchCriticalData() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(async () => {
    // Prefetch pecas - most commonly used data
    queryClient.prefetchQuery({
      queryKey: ['pecas', { includeCatalogOnly: false }],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('pecas')
          .select('id, nome, codigo, preco_venda, preco_revenda, estoque, categoria, imagem_url, ativo')
          .or('catalogo_only.is.null,catalogo_only.eq.false')
          .order('nome');
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 10,
    });

    // Prefetch revendedoras
    queryClient.prefetchQuery({
      queryKey: ['revendedoras'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('revendedoras')
          .select('id, nome, telefone, email, ativo, comissao_percentual')
          .order('nome');
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 10,
    });
  }, [queryClient]);

  useEffect(() => {
    // Delay prefetching to not block initial render
    const timer = setTimeout(prefetch, 1000);
    return () => clearTimeout(timer);
  }, [prefetch]);
}

/**
 * Prefetch data when hovering over navigation items
 */
export function useNavigationPrefetch() {
  const queryClient = useQueryClient();

  const prefetchPecas = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['pecas', { includeCatalogOnly: false }],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('pecas')
          .select('*')
          .or('catalogo_only.is.null,catalogo_only.eq.false')
          .order('nome');
        if (error) throw error;
        return data;
      },
    });
  }, [queryClient]);

  const prefetchRevendedoras = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['revendedoras'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('revendedoras')
          .select('*')
          .order('nome');
        if (error) throw error;
        return data;
      },
    });
  }, [queryClient]);

  const prefetchVendas = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['vendas'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('vendas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        return data;
      },
    });
  }, [queryClient]);

  return {
    prefetchPecas,
    prefetchRevendedoras,
    prefetchVendas,
  };
}
