import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { db, supabase } from '@/lib/supabase-db';
import { useAuth } from '@/contexts/AuthContext';
import {
  initDB,
  addPendingVenda,
  getPendingVendas,
  markVendaSynced,
  markVendaFailed,
  cleanupSyncedVendas,
  cachePecas,
  getCachedPecas,
  getPendingVendasCount,
  setSyncMeta,
  getSyncMeta,
  type OfflineVenda,
  type CachedPeca,
} from '@/lib/indexeddb';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;
  addOfflineVenda: (venda: Omit<OfflineVenda, 'synced'>) => Promise<void>;
  getCachedProducts: () => Promise<CachedPeca[]>;
  cacheProducts: (pecas: CachedPeca[]) => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Initialize IndexedDB and load state
  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        const count = await getPendingVendasCount();
        setPendingCount(count);
        
        const lastSync = await getSyncMeta('lastSyncTime');
        if (lastSync) {
          setLastSyncTime(new Date(lastSync));
        }
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };
    
    init();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restabelecida', {
        description: 'Sincronizando vendas pendentes...',
      });
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Você está offline', {
        description: 'As vendas serão salvas localmente',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync pending sales
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing || !user) return;

    setIsSyncing(true);
    
    try {
      const pendingVendas = await getPendingVendas();
      
      if (pendingVendas.length === 0) {
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const venda of pendingVendas) {
        try {
          // Insert venda with organization_id from user's membership
          const { data: membership } = await db
            .from('memberships')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          const { data: vendaData, error: vendaError } = await db
            .from('vendas')
            .insert({
              organization_id: membership?.organization_id,
              valor_total: venda.total,
              subtotal: venda.total,
              desconto: venda.desconto,
              status: 'finalizada',
              forma_pagamento: venda.pagamentos[0]?.metodo || 'dinheiro',
            })
            .select()
            .single();

          if (vendaError) throw vendaError;
          if (!vendaData) throw new Error('Venda não criada');

          // Insert venda items
          const { error: itensError } = await db
            .from('venda_itens')
            .insert(
              venda.itens.map(item => ({
                venda_id: vendaData.id,
                peca_id: item.peca_id,
                peca_nome: item.peca_nome,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
              }))
            );

          if (itensError) throw itensError;

          // Update stock - fetch current and decrement
          for (const item of venda.itens) {
            const { data: peca } = await db
              .from('pecas')
              .select('estoque')
              .eq('id', item.peca_id)
              .single();
            
            if (peca) {
              await db
                .from('pecas')
                .update({ estoque: Math.max(0, peca.estoque - item.quantidade) })
                .eq('id', item.peca_id);
            }
          }

          await markVendaSynced(venda.id);
          successCount++;
        } catch (error: any) {
          await markVendaFailed(venda.id, error.message);
          errorCount++;
        }
      }

      // Update pending count
      const newCount = await getPendingVendasCount();
      setPendingCount(newCount);

      // Update last sync time
      const now = new Date();
      setLastSyncTime(now);
      await setSyncMeta('lastSyncTime', now.toISOString());

      // Cleanup old synced sales
      await cleanupSyncedVendas(7);

      if (successCount > 0) {
        toast.success(`${successCount} venda(s) sincronizada(s)`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} venda(s) com erro de sincronização`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro ao sincronizar vendas');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, user]);

  // Auto-sync every 5 minutes when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      syncNow();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isOnline, syncNow]);

  // Add a sale to offline storage
  const addOfflineVenda = useCallback(async (vendaData: Omit<OfflineVenda, 'synced'>) => {
    try {
      const venda: OfflineVenda = {
        ...vendaData,
        synced: false,
      };

      await addPendingVenda(venda);
      
      const count = await getPendingVendasCount();
      setPendingCount(count);

      if (!isOnline) {
        toast.info('Venda salva localmente', {
          description: 'Será sincronizada quando a conexão for restabelecida',
        });
      }
    } catch (error) {
      console.error('Failed to save offline sale:', error);
      throw error;
    }
  }, [isOnline]);

  // Get cached products
  const getCachedProducts = useCallback(async (): Promise<CachedPeca[]> => {
    return getCachedPecas();
  }, []);

  // Cache products for offline use
  const cacheProducts = useCallback(async (pecas: CachedPeca[]) => {
    await cachePecas(pecas);
    await setSyncMeta('productsCachedAt', new Date().toISOString());
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncNow,
    addOfflineVenda,
    getCachedProducts,
    cacheProducts,
  };
}
