import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from '@/hooks/use-toast';

export interface Fiado {
  id: string;
  organization_id: string | null;
  cliente_id: string | null;
  venda_id: string | null;
  valor_total: number;
  valor_pago: number;
  data_vencimento: string;
  status: 'aberto' | 'pago' | 'vencido';
  observacoes: string | null;
  notificacao_enviada: boolean | null;
  notificacao_enviada_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  clientes?: { nome: string; telefone: string | null; whatsapp: string | null } | null;
}

export function useFiado() {
  return useQuery({
    queryKey: ['fiado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiado')
        .select('*, clientes(nome, telefone, whatsapp)')
        .order('data_vencimento', { ascending: true });
      if (error) throw error;
      return data as Fiado[];
    },
  });
}

export function useAddFiado() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (fiado: {
      cliente_id: string;
      venda_id?: string | null;
      valor_total: number;
      data_vencimento: string;
      observacoes?: string | null;
    }) => {
      if (!organizationId) throw new Error('Organization not found');
      const { data, error } = await supabase
        .from('fiado')
        .insert({ ...fiado, organization_id: organizationId, status: 'aberto', valor_pago: 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiado'] });
      toast({ title: 'Fiado registrado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao registrar fiado', variant: 'destructive' });
    },
  });
}

export function useDarBaixaFiado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, valor_pago, valor_total }: { id: string; valor_pago: number; valor_total: number }) => {
      const novoStatus = valor_pago >= valor_total ? 'pago' : 'aberto';
      const { data, error } = await supabase
        .from('fiado')
        .update({ valor_pago, status: novoStatus })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fiado'] });
      toast({ title: data.status === 'pago' ? 'Fiado quitado!' : 'Pagamento parcial registrado!' });
    },
    onError: () => {
      toast({ title: 'Erro ao dar baixa', variant: 'destructive' });
    },
  });
}

export function useDeleteFiado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fiado').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiado'] });
      toast({ title: 'Fiado removido!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover fiado', variant: 'destructive' });
    },
  });
}
