/**
 * Offline sales queue for PDV.
 * Persists pending venda payloads in localStorage so they can be sent
 * to Supabase once the connection is restored.
 */

const KEY = 'nexsiles.pdv.offline_queue.v1';

export interface PagamentoOffline {
  metodo: string;
  valor: number;
}

export interface OfflineVendaItem {
  peca_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface OfflineVenda {
  valor_total: number;
  subtotal: number;
  desconto: number;
  cliente_id: string | null;
  revendedora_id: string | null;
  status: string;
  observacoes: string | null;
  forma_pagamento: string;
  parcelas: number;
}

export interface OfflineFiado {
  cliente_id: string;
  valor_total: number;
  data_vencimento: string;
  observacoes?: string;
}

export interface OfflineQueueItem {
  id: string;
  createdAt: string;
  venda: OfflineVenda;
  items: OfflineVendaItem[];
  caixaSessaoId: string;
  fiado?: OfflineFiado;
  cupomId?: string;
  pagamentos: PagamentoOffline[];
}

function read(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OfflineQueueItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: OfflineQueueItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('offline-queue-changed'));
  } catch (err) {
    console.error('[offlineQueue] persist failed', err);
  }
}

export const offlineQueue = {
  list: () => read(),
  count: () => read().length,
  push(item: Omit<OfflineQueueItem, 'id' | 'createdAt'>) {
    const list = read();
    const full: OfflineQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    list.push(full);
    write(list);
    return full;
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
  clear() {
    write([]);
  },
};
