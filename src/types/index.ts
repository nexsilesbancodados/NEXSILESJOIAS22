// Re-export types from useSupabaseData for consistency
// This file maintains backward compatibility

export type {
  Peca,
  Profile,
  Fornecedor,
  Cliente,
  Maleta,
  MaletaItem,
  Venda,
  VendaItem,
  Pagamento,
  Romaneio,
  RomaneioItem,
  CaixaSessao,
  MovimentoCaixa,
  Configuracao,
  Catalogo,
  CatalogoItem,
  ModeloEtiqueta,
  Banho,
  EnvioGalvanica,
} from '@/hooks/useSupabaseData';

// Legacy type aliases for backward compatibility
export interface CarrinhoItem {
  peca: import('@/hooks/useSupabaseData').Peca;
  quantidade: number;
}

export interface SelectedItem {
  item: import('@/hooks/useSupabaseData').CatalogoItem;
  quantidade: number;
}
