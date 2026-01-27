// Helper function to translate database errors to user-friendly messages
export function translateDatabaseError(error: unknown, context?: string): string {
  const err = error as { message?: string; code?: string; details?: string };
  const message = err?.message?.toLowerCase() || '';
  const code = err?.code || '';
  const details = err?.details?.toLowerCase() || '';
  
  // Foreign key constraint violations
  if (code === '23503' || message.includes('foreign key') || message.includes('violates foreign key')) {
    if (message.includes('maletas_pecas') || details.includes('maletas_pecas')) {
      return 'Esta peça está em uma maleta. Remova-a da maleta primeiro.';
    }
    if (message.includes('vendas_pecas') || details.includes('vendas_pecas')) {
      return 'Esta peça está vinculada a vendas e não pode ser removida.';
    }
    if (message.includes('catalogos_pecas') || details.includes('catalogos_pecas')) {
      return 'Esta peça está em um catálogo. Remova-a do catálogo primeiro.';
    }
    if (message.includes('romaneios_pecas') || details.includes('romaneios_pecas')) {
      return 'Esta peça está em um romaneio e não pode ser removida.';
    }
    if (message.includes('maletas') || details.includes('maletas')) {
      return 'Este registro está vinculado a maletas e não pode ser removido.';
    }
    if (message.includes('vendas') || details.includes('vendas')) {
      return 'Este registro está vinculado a vendas e não pode ser removido.';
    }
    if (message.includes('metas') || details.includes('metas')) {
      return 'Este registro está vinculado a metas e não pode ser removido.';
    }
    if (message.includes('pedidos_catalogo') || details.includes('pedidos_catalogo')) {
      return 'Este item está vinculado a pedidos e não pode ser removido.';
    }
    return `Não é possível remover: existem registros dependentes. ${context || ''}`;
  }
  
  // RLS policy violations
  if (code === '42501' || message.includes('policy') || message.includes('row-level security')) {
    return 'Você não tem permissão para realizar esta ação.';
  }
  
  // Not found
  if (code === 'PGRST116' || message.includes('no rows')) {
    return 'Registro não encontrado.';
  }
  
  // Unique constraint violations
  if (code === '23505' || message.includes('duplicate') || message.includes('unique')) {
    return 'Já existe um registro com estes dados.';
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  
  // JWT/Auth errors
  if (message.includes('jwt') || message.includes('token')) {
    return 'Sessão expirada. Faça login novamente.';
  }
  
  // Generic fallback with context
  console.error('Database error:', error);
  return context ? `Erro ao ${context}. Tente novamente.` : 'Erro inesperado. Tente novamente.';
}
