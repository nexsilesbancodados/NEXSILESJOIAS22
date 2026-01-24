import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { toast } from 'sonner';

const from = (table: string) => supabase.from(table);

export interface Envio {
  id: string;
  user_id: string;
  romaneio_id: string | null;
  maleta_id: string | null;
  destinatario_nome: string;
  destinatario_telefone: string | null;
  destinatario_endereco: string | null;
  destinatario_cidade: string | null;
  destinatario_estado: string | null;
  destinatario_cep: string | null;
  codigo_rastreio: string | null;
  transportadora: string | null;
  tipo_envio: 'sedex' | 'pac' | 'transportadora' | 'motoboy' | 'retirada';
  valor_frete: number;
  peso: number | null;
  status: 'preparando' | 'postado' | 'em_transito' | 'entregue' | 'devolvido';
  data_postagem: string | null;
  data_entrega: string | null;
  previsao_entrega: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RastreioEvento {
  id: string;
  envio_id: string;
  data: string;
  local: string | null;
  descricao: string;
  created_at: string;
}

export function useEnvios() {
  return useQuery({
    queryKey: ['envios'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await from('envios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Envio[];
    },
  });
}

export function useEnvio(id: string | undefined) {
  return useQuery({
    queryKey: ['envio', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await from('envios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Envio;
    },
    enabled: !!id,
  });
}

export function useRastreioEventos(envioId: string | undefined) {
  return useQuery({
    queryKey: ['rastreio-eventos', envioId],
    queryFn: async () => {
      if (!envioId) return [];
      
      const { data, error } = await from('rastreio_eventos')
        .select('*')
        .eq('envio_id', envioId)
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as RastreioEvento[];
    },
    enabled: !!envioId,
  });
}

export function useAddEnvio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (envio: Omit<Envio, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await from('envios')
        .insert({ ...envio, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envios'] });
      toast.success('Envio criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar envio');
    },
  });
}

export function useUpdateEnvio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Envio> & { id: string }) => {
      const { data, error } = await from('envios')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['envios'] });
      queryClient.invalidateQueries({ queryKey: ['envio', variables.id] });
      toast.success('Envio atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar envio');
    },
  });
}

export function useAddRastreioEvento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (evento: Omit<RastreioEvento, 'id' | 'created_at'>) => {
      const { data, error } = await from('rastreio_eventos')
        .insert(evento)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rastreio-eventos', variables.envio_id] });
      toast.success('Evento de rastreio adicionado!');
    },
    onError: () => {
      toast.error('Erro ao adicionar evento');
    },
  });
}

export function useDeleteEnvio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from('envios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envios'] });
      toast.success('Envio removido!');
    },
    onError: () => {
      toast.error('Erro ao remover envio');
    },
  });
}
