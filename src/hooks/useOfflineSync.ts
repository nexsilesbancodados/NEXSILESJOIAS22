import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  addPendingVenda,
  getAllPendingVendas,
  getPendingVendasCount,
  getSyncMeta,
  markVendaFailed,
  markVendaSynced,
  setSyncMeta,
  type OfflineVenda,
  type OfflineVendaPayload,
} from '@/lib/indexeddb';
import { useAddVenda } from '@/hooks/useSupabaseData';
import { useAddFiado } from '@/hooks/useFiado';
import { useUsarCupom } from '@/hooks/useCampanhas';

const LAST_SYNC_KEY = 'last_sync_time';

/**
 * Offline PDV sync hook.
 * - Tracks online status and pending sales count
 * - Auto-flushes queued vendas when connectivity returns
 * - Exposes manual sync and enqueue helpers
 */
export function useOfflineSync() {
  const addVenda = useAddVenda();
  const addFiado = useAddFiado();
  const usarCupom = useUsarCupom();

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const runningRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      setPendingCount(await getPendingVendasCount());
    } catch {
      // ignore
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (runningRef.current || !navigator.onLine) return;
    runningRef.current = true;
    setIsSyncing(true);
    let ok = 0;
    let fail = 0;

    try {
      const pending = await getAllPendingVendas();
      const replayable = pending.filter((v) => !!v.payload && !v.syncError);

      for (const item of replayable) {
        const payload = item.payload as OfflineVendaPayload;
        try {
          if (payload.cupomId) {
            await usarCupom.mutateAsync(payload.cupomId).catch(() => null);
          }
          const venda = await addVenda.mutateAsync({
            venda: payload.venda as any,
            items: payload.items,
            caixaSessaoId: payload.caixaSessaoId,
          });
          if (payload.fiado) {
            await addFiado
              .mutateAsync({ ...payload.fiado, venda_id: venda?.id || null } as any)
              .catch(() => null);
          }
          await markVendaSynced(item.id);
          ok += 1;
        } catch (err: any) {
          await markVendaFailed(item.id, err?.message || 'Falha ao sincronizar');
          fail += 1;
        }
      }

      const now = new Date();
      await setSyncMeta(LAST_SYNC_KEY, now.toISOString());
      setLastSyncTime(now);
    } finally {
      runningRef.current = false;
      setIsSyncing(false);
      await refreshCount();
      window.dispatchEvent(new CustomEvent('offline-queue-changed'));
      if (ok > 0) toast.success(`${ok} venda(s) offline sincronizada(s)`);
      if (fail > 0) toast.error(`${fail} venda(s) com erro — verifique o painel`);
    }
  }, [addVenda, addFiado, usarCupom, refreshCount]);

  const enqueue = useCallback(async (venda: OfflineVenda) => {
    await addPendingVenda(venda);
    await refreshCount();
    window.dispatchEvent(new CustomEvent('offline-queue-changed'));
  }, [refreshCount]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const onOffline = () => setIsOnline(false);
    const onChange = () => refreshCount();

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('offline-queue-changed', onChange);

    (async () => {
      await refreshCount();
      const stored = await getSyncMeta(LAST_SYNC_KEY).catch(() => null);
      if (stored) setLastSyncTime(new Date(stored));
      if (navigator.onLine) syncNow();
    })();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('offline-queue-changed', onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, pendingCount, isSyncing, lastSyncTime, syncNow, enqueue };
}
