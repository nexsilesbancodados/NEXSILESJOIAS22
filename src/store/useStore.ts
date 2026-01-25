import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Peca } from '@/hooks/useSupabaseData';

// Local types for cart functionality (not stored in Supabase)
interface LocalCarrinhoItem {
  peca: Peca;
  quantidade: number;
}

interface LocalCaixaSessao {
  id: string;
  data_abertura: Date;
  data_fechamento?: Date;
  fundo_troco: number;
  status: 'aberto' | 'fechado';
}

interface AppState {
  // Carrinho PDV (local only)
  carrinho: LocalCarrinhoItem[];
  addToCarrinho: (peca: Peca) => void;
  removeFromCarrinho: (pecaId: string) => void;
  updateCarrinhoQuantidade: (pecaId: string, quantidade: number) => void;
  clearCarrinho: () => void;

  // Caixa (local state - real data comes from Supabase)
  caixaAtual: LocalCaixaSessao | null;
  abrirCaixa: (fundoTroco: number) => void;
  fecharCaixa: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Carrinho
      carrinho: [],
      addToCarrinho: (peca) => set((state) => {
        const existente = state.carrinho.find((item) => item.peca.id === peca.id);
        if (existente) {
          return {
            carrinho: state.carrinho.map((item) =>
              item.peca.id === peca.id
                ? { ...item, quantidade: item.quantidade + 1 }
                : item
            )
          };
        }
        return { carrinho: [...state.carrinho, { peca, quantidade: 1 }] };
      }),
      removeFromCarrinho: (pecaId) => set((state) => ({
        carrinho: state.carrinho.filter((item) => item.peca.id !== pecaId)
      })),
      updateCarrinhoQuantidade: (pecaId, quantidade) => set((state) => {
        if (quantidade <= 0) {
          return { carrinho: state.carrinho.filter((item) => item.peca.id !== pecaId) };
        }
        return {
          carrinho: state.carrinho.map((item) =>
            item.peca.id === pecaId ? { ...item, quantidade } : item
          )
        };
      }),
      clearCarrinho: () => set({ carrinho: [] }),

      // Caixa local
      caixaAtual: null,
      abrirCaixa: (fundoTroco) => set({
        caixaAtual: {
          id: Date.now().toString(),
          data_abertura: new Date(),
          fundo_troco: fundoTroco,
          status: 'aberto'
        }
      }),
      fecharCaixa: () => set((state) => {
        if (!state.caixaAtual) return state;
        return { caixaAtual: null };
      }),
    }),
    {
      name: 'nexsiles-storage',
    }
  )
);
