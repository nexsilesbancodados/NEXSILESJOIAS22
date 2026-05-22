/**
 * Wrappers tipados para as RPCs atômicas do fluxo de Maletas.
 * Todas as RPCs validam organização e usam locks no servidor — o frontend
 * apenas dispara, mostra toast e invalida o cache do React Query.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['maletas'] });
  qc.invalidateQueries({ queryKey: ['maletas-pecas'] });
  qc.invalidateQueries({ queryKey: ['pecas'] });
  qc.invalidateQueries({ queryKey: ['maleta-conferencias'] });
};

const handleError = (err: unknown, fallback: string) => {
  const message = err instanceof Error ? err.message : fallback;
  toast.error(message.replace(/^.*: /, ''));
};

export interface ConferenciaItemInput {
  maleta_peca_id: string;
  vendida: number;
  devolvida: number;
  perdida: number;
  observacao?: string;
}

export interface ConferenciaResult {
  conferencia_id: string;
  total_esperado: number;
  total_conferido: number;
  divergencias: Array<{ maleta_peca_id: string; nome: string; esperado: number; conferido: number }>;
}

export interface FechamentoResult {
  devolvidas: number;
  vendidas: number;
  perdidas: number;
  valor_vendido: number;
}

export function useMaletaRPC() {
  const qc = useQueryClient();

  const adicionarPeca = useMutation({
    mutationFn: async (vars: { maletaId: string; pecaId: string; quantidade: number; preco?: number }) => {
      const { data, error } = await supabase.rpc('maleta_adicionar_peca' as never, {
        p_maleta_id: vars.maletaId,
        p_peca_id: vars.pecaId,
        p_quantidade: vars.quantidade,
        p_preco: vars.preco ?? null,
      } as never);
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => { invalidate(qc); toast.success('Peça adicionada à maleta'); },
    onError: (e) => handleError(e, 'Erro ao adicionar peça'),
  });

  const removerPeca = useMutation({
    mutationFn: async (vars: { maletaPecaId: string; quantidade: number }) => {
      const { error } = await supabase.rpc('maleta_remover_peca' as never, {
        p_maleta_peca_id: vars.maletaPecaId,
        p_quantidade: vars.quantidade,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(qc); toast.success('Peça removida da maleta'); },
    onError: (e) => handleError(e, 'Erro ao remover peça'),
  });

  const registrarVenda = useMutation({
    mutationFn: async (vars: { maletaPecaId: string; quantidade: number; preco?: number }) => {
      const { error } = await supabase.rpc('maleta_registrar_venda' as never, {
        p_maleta_peca_id: vars.maletaPecaId,
        p_quantidade: vars.quantidade,
        p_preco: vars.preco ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(qc); toast.success('Venda registrada'); },
    onError: (e) => handleError(e, 'Erro ao registrar venda'),
  });

  const desfazerVenda = useMutation({
    mutationFn: async (vars: { maletaPecaId: string; quantidade: number }) => {
      const { error } = await supabase.rpc('maleta_desfazer_venda' as never, {
        p_maleta_peca_id: vars.maletaPecaId,
        p_quantidade: vars.quantidade,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(qc); toast.success('Venda estornada'); },
    onError: (e) => handleError(e, 'Erro ao estornar venda'),
  });

  const marcarPerdida = useMutation({
    mutationFn: async (vars: { maletaPecaId: string; quantidade: number; motivo: string }) => {
      const { error } = await supabase.rpc('maleta_marcar_perdida' as never, {
        p_maleta_peca_id: vars.maletaPecaId,
        p_quantidade: vars.quantidade,
        p_motivo: vars.motivo,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(qc); toast.success('Peça marcada como perdida'); },
    onError: (e) => handleError(e, 'Erro ao marcar como perdida'),
  });

  const conferir = useMutation({
    mutationFn: async (vars: { maletaId: string; itens: ConferenciaItemInput[]; observacoes?: string }) => {
      const { data, error } = await supabase.rpc('maleta_conferir' as never, {
        p_maleta_id: vars.maletaId,
        p_itens: vars.itens as never,
        p_observacoes: vars.observacoes ?? null,
      } as never);
      if (error) throw error;
      return data as unknown as ConferenciaResult;
    },
    onSuccess: (data) => {
      invalidate(qc);
      const div = data?.divergencias?.length ?? 0;
      if (div > 0) toast.warning(`Conferência salva com ${div} divergência(s)`);
      else toast.success('Conferência salva sem divergências');
    },
    onError: (e) => handleError(e, 'Erro ao conferir maleta'),
  });

  const fechar = useMutation({
    mutationFn: async (vars: { maletaId: string; forcar?: boolean }) => {
      const { data, error } = await supabase.rpc('maleta_fechar_v2' as never, {
        p_maleta_id: vars.maletaId,
        p_forcar: vars.forcar ?? false,
      } as never);
      if (error) throw error;
      return data as unknown as FechamentoResult;
    },
    onSuccess: (data) => {
      invalidate(qc);
      toast.success(`Maleta fechada — ${data.vendidas} vendida(s), ${data.devolvidas} devolvida(s), ${data.perdidas} perdida(s)`);
    },
    onError: (e) => handleError(e, 'Erro ao fechar maleta'),
  });

  return { adicionarPeca, removerPeca, registrarVenda, desfazerVenda, marcarPerdida, conferir, fechar };
}
