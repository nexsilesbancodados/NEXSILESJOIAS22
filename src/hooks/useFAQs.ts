import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface FAQ {
  id: string;
  organization_id: string | null;
  pergunta: string;
  resposta: string;
  categoria: string | null;
  palavras_chave: string[] | null;
  ativo: boolean | null;
  uso_count: number | null;
  created_at: string;
  updated_at: string;
}

export function useFAQs() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['faqs', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('agente_faqs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('uso_count', { ascending: false });

      if (error) throw error;
      return data as FAQ[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateFAQ() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (faq: Omit<FAQ, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'uso_count'>) => {
      const { data, error } = await supabase
        .from('agente_faqs')
        .insert({
          ...faq,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar FAQ: ' + error.message);
    },
  });
}

export function useUpdateFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FAQ> & { id: string }) => {
      const { data, error } = await supabase
        .from('agente_faqs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ atualizada');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar FAQ: ' + error.message);
    },
  });
}

export function useDeleteFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agente_faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ removida');
    },
    onError: (error) => {
      toast.error('Erro ao remover FAQ: ' + error.message);
    },
  });
}

export function useIncrementFAQUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: current } = await supabase
        .from('agente_faqs')
        .select('uso_count')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('agente_faqs')
        .update({ uso_count: (current?.uso_count || 0) + 1 })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
}
