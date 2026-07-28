import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { offlineQueue, type OfflineQueueItem } from '@/lib/offlineQueue';
import { useAddVenda } from '@/hooks/useSupabaseData';
import { useAddFiado } from '@/hooks/useFiado';
import { useUsarCupom } from '@/hooks/useCampanhas';

/**
 * Watches connectivity and flushes pending offline sales when back online.
 * Exposes pendingCount and a manual flush trigger.
 */
export function useOfflineSync() {
  const addVenda = useAddVenda();
  const addFiado = useAddFiado();
  const usarCupom = useUsarCupom();

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [pendingCount, setPendingCount] = useState(() => offlineQueue.count());
  const [isSyncing, setIsSyncing] = useState(false);
  const flushingRef = useRef(false);

  const refreshCount = useCallback(() => {
    setPendingCount(offlineQueue.count());
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    if (!navigator.onLine) return;
    const pending = offlineQueue.list();
    if (pending.length === 0) return;

    flushingRef.current = true;
    setIsSyncing(true);

    let ok = 0;
    let fail = 0;

    for (const item of pending) {
      try {
        if (item.cupomId) {
          await usarCupom.mutateAsync(item.cupomId).catch(() => null);
        }
        const venda = await addVenda.mutateAsync({
          venda: item.venda as any,
          items: item.items,
          caixaSessaoId: item.caixaSessaoId,
        });
        if (item.fiado) {
          await addFiado
            .mutateAsync({ ...item.fiado, venda_id: venda?.id || null } as any)
            .catch(() => null);
        }
        offlineQueue.remove(item.id);
        ok += 1;
      } catch (err) {
        console.error('[offlineSync] falha ao sincronizar venda', err);
        fail += 1;
      }
    }

    setIsSyncing(false);
    flushingRef.current = false;
    refreshCount();

    if (ok > 0) toast.success(`${ok} venda(s) offline sincronizada(s)`);
    if (fail > 0) toast.error(`${fail} venda(s) não puderam ser enviadas`);
  }, [addVenda, addFiado, usarCupom, refreshCount]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      flush();
    };
    const onOffline = () => setIsOnline(false);
    const onChange = () => refreshCount();

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('offline-queue-changed', onChange);

    if (navigator.onLine) flush();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('offline-queue-changed', onChange);
    };
  }, [flush, refreshCount]);

  const enqueue = useCallback((payload: Omit<OfflineQueueItem, 'id' | 'createdAt'>) => {
    const saved = offlineQueue.push(payload);
    refreshCount();
    return saved;
  }, [refreshCount]);

  return { isOnline, pendingCount, isSyncing, flush, enqueue };
}
