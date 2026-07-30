import { dbRpc } from '@/lib/supabase-db';

/**
 * Movimenta o estoque de uma peça de forma atômica, no banco.
 *
 * Antes cada chamador fazia SELECT estoque → cálculo no JS → UPDATE estoque =
 * valor (em alguns pontos usando até o valor em cache do React Query, com
 * staleTime de 10 min). Com dois caixas vendendo ao mesmo tempo uma das baixas
 * era perdida. A RPC `ajustar_estoque_peca` resolve com `estoque = estoque +
 * delta` numa única instrução, nunca deixa negativo e valida a organização.
 *
 * @param delta negativo para dar baixa, positivo para devolver ao estoque.
 * @returns o estoque resultante, ou null quando não houve movimento.
 */
export async function ajustarEstoque(pecaId: string, delta: number): Promise<number | null> {
  if (!pecaId || !delta) return null;

  const { data, error } = await dbRpc('ajustar_estoque_peca', {
    p_peca_id: pecaId,
    p_delta: delta,
  });

  if (error) {
    console.error('Error adjusting stock for piece', pecaId, error);
    throw error;
  }

  return typeof data === 'number' ? data : null;
}
