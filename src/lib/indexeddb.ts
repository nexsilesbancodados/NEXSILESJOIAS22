/**
 * IndexedDB Utility for Offline PDV
 * Stores pending sales and product cache for offline operation
 */

const DB_NAME = 'nexsile_pdv_offline';
const DB_VERSION = 1;

export interface OfflineVenda {
  id: string;
  itens: Array<{
    peca_id: string;
    peca_nome: string;
    quantidade: number;
    preco_unitario: number;
  }>;
  pagamentos: Array<{
    metodo: string;
    valor: number;
  }>;
  total: number;
  subtotal: number;
  desconto: number;
  cliente_nome: string | null;
  created_at: string;
  synced: boolean;
  syncError?: string;
}

export interface CachedPeca {
  id: string;
  nome: string;
  codigo: string;
  preco_venda: number;
  estoque: number;
  imagem_url: string | null;
  categoria: string | null;
  cached_at: string;
}

let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Store for pending offline sales
      if (!database.objectStoreNames.contains('vendas_pendentes')) {
        const vendasStore = database.createObjectStore('vendas_pendentes', { keyPath: 'id' });
        vendasStore.createIndex('synced', 'synced', { unique: false });
        vendasStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Store for cached products
      if (!database.objectStoreNames.contains('pecas_cache')) {
        const pecasStore = database.createObjectStore('pecas_cache', { keyPath: 'id' });
        pecasStore.createIndex('codigo', 'codigo', { unique: true });
        pecasStore.createIndex('cached_at', 'cached_at', { unique: false });
      }

      // Store for sync metadata
      if (!database.objectStoreNames.contains('sync_meta')) {
        database.createObjectStore('sync_meta', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Add a pending sale to IndexedDB
 */
export async function addPendingVenda(venda: OfflineVenda): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['vendas_pendentes'], 'readwrite');
    const store = transaction.objectStore('vendas_pendentes');
    
    const request = store.add(venda);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to add pending sale'));
  });
}

/**
 * Get all pending (unsynced) sales
 */
export async function getPendingVendas(): Promise<OfflineVenda[]> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['vendas_pendentes'], 'readonly');
    const store = transaction.objectStore('vendas_pendentes');
    const index = store.index('synced');
    
    const request = index.getAll(IDBKeyRange.only(false));
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get pending sales'));
  });
}

/**
 * Mark a sale as synced
 */
export async function markVendaSynced(id: string): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['vendas_pendentes'], 'readwrite');
    const store = transaction.objectStore('vendas_pendentes');
    
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const venda = getRequest.result;
      if (venda) {
        venda.synced = true;
        const updateRequest = store.put(venda);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(new Error('Failed to update sale'));
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(new Error('Failed to get sale'));
  });
}

/**
 * Mark a sale as failed with error message
 */
export async function markVendaFailed(id: string, error: string): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['vendas_pendentes'], 'readwrite');
    const store = transaction.objectStore('vendas_pendentes');
    
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const venda = getRequest.result;
      if (venda) {
        venda.syncError = error;
        const updateRequest = store.put(venda);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(new Error('Failed to update sale'));
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(new Error('Failed to get sale'));
  });
}

/**
 * Delete synced sales older than specified days
 */
export async function cleanupSyncedVendas(daysOld: number = 7): Promise<number> {
  const database = await initDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['vendas_pendentes'], 'readwrite');
    const store = transaction.objectStore('vendas_pendentes');
    
    const request = store.openCursor();
    let deletedCount = 0;
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const venda = cursor.value as OfflineVenda;
        if (venda.synced && new Date(venda.created_at) < cutoffDate) {
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      } else {
        resolve(deletedCount);
      }
    };
    
    request.onerror = () => reject(new Error('Failed to cleanup sales'));
  });
}

/**
 * Cache products for offline access
 */
export async function cachePecas(pecas: CachedPeca[]): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pecas_cache'], 'readwrite');
    const store = transaction.objectStore('pecas_cache');
    
    // Clear existing cache
    store.clear();
    
    // Add all products
    pecas.forEach(peca => {
      store.add({
        ...peca,
        cached_at: new Date().toISOString(),
      });
    });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to cache products'));
  });
}

/**
 * Get cached products
 */
export async function getCachedPecas(): Promise<CachedPeca[]> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pecas_cache'], 'readonly');
    const store = transaction.objectStore('pecas_cache');
    
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get cached products'));
  });
}

/**
 * Get cached product by code
 */
export async function getCachedPecaByCodigo(codigo: string): Promise<CachedPeca | null> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pecas_cache'], 'readonly');
    const store = transaction.objectStore('pecas_cache');
    const index = store.index('codigo');
    
    const request = index.get(codigo);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get cached product'));
  });
}

/**
 * Update sync metadata
 */
export async function setSyncMeta(key: string, value: any): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sync_meta'], 'readwrite');
    const store = transaction.objectStore('sync_meta');
    
    const request = store.put({ key, value, updated_at: new Date().toISOString() });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to set sync meta'));
  });
}

/**
 * Get sync metadata
 */
export async function getSyncMeta(key: string): Promise<any | null> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sync_meta'], 'readonly');
    const store = transaction.objectStore('sync_meta');
    
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result?.value || null);
    request.onerror = () => reject(new Error('Failed to get sync meta'));
  });
}

/**
 * Get count of pending sales
 */
export async function getPendingVendasCount(): Promise<number> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['vendas_pendentes'], 'readonly');
    const store = transaction.objectStore('vendas_pendentes');
    const index = store.index('synced');
    
    const request = index.count(IDBKeyRange.only(false));
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to count pending sales'));
  });
}

/**
 * Get all pending sales (both unsynced and failed)
 */
export async function getAllPendingVendas(): Promise<OfflineVenda[]> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['vendas_pendentes'], 'readonly');
    const store = transaction.objectStore('vendas_pendentes');
    
    const request = store.getAll();
    
    request.onsuccess = () => {
      const vendas = request.result.filter((v: OfflineVenda) => !v.synced);
      resolve(vendas);
    };
    request.onerror = () => reject(new Error('Failed to get all pending sales'));
  });
}

/**
 * Delete a pending sale by ID
 */
export async function deletePendingVenda(id: string): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['vendas_pendentes'], 'readwrite');
    const store = transaction.objectStore('vendas_pendentes');
    
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete pending sale'));
  });
}

/**
 * Retry a failed sale by clearing its error
 */
export async function retryPendingVenda(id: string): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['vendas_pendentes'], 'readwrite');
    const store = transaction.objectStore('vendas_pendentes');
    
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const venda = getRequest.result;
      if (venda) {
        venda.syncError = undefined;
        const updateRequest = store.put(venda);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(new Error('Failed to retry sale'));
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(new Error('Failed to get sale'));
  });
}
