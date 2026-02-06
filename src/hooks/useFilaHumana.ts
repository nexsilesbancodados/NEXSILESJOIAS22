import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface FilaHumana {
  id: string;
  organization_id: string | null;
  conversa_id: string | null;
  motivo: string | null;
  prioridade: number | null;
  status: string | null;
  atendente_id: string | null;
  entrou_fila_at: string | null;
  atendido_at: string | null;
  created_at: string;
  conversa?: {
    id: string;
    session_id: string;
    cliente_nome: string | null;
    cliente_telefone: string | null;
    total_mensagens: number | null;
  };
}

export function useFilaHumana() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['fila-humana', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('agente_fila_humana')
        .select(`
          *,
          conversa:agente_conversas(id, session_id, cliente_nome, cliente_telefone, total_mensagens)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'aguardando')
        .order('prioridade', { ascending: false })
        .order('entrou_fila_at', { ascending: true });

      if (error) throw error;
      return data as FilaHumana[];
    },
    enabled: !!organizationId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useAddToFilaHumana() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async ({ conversaId, motivo }: { conversaId: string; motivo?: string }) => {
      // Update conversa status
      await supabase
        .from('agente_conversas')
        .update({ status: 'aguardando_humano' })
        .eq('id', conversaId);

      // Add to queue
      const { data, error } = await supabase
        .from('agente_fila_humana')
        .insert({
          organization_id: organizationId,
          conversa_id: conversaId,
          motivo,
          status: 'aguardando',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fila-humana'] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      toast.success('Conversa adicionada à fila de atendimento humano');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar à fila: ' + error.message);
    },
  });
}

export function useAtenderFila() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filaId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get the fila item
      const { data: fila } = await supabase
        .from('agente_fila_humana')
        .select('conversa_id')
        .eq('id', filaId)
        .single();

      if (!fila?.conversa_id) throw new Error('Conversa não encontrada');

      // Update fila status
      const { error: filaError } = await supabase
        .from('agente_fila_humana')
        .update({
          status: 'atendido',
          atendente_id: user?.id,
          atendido_at: new Date().toISOString(),
        })
        .eq('id', filaId);

      if (filaError) throw filaError;

      // Update conversa
      const { data, error } = await supabase
        .from('agente_conversas')
        .update({
          status: 'em_atendimento',
          assigned_to: user?.id,
        })
        .eq('id', fila.conversa_id)
        .select()
        .single();

      if (error) throw error;
      return { conversa: data, filaId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fila-humana'] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      toast.success('Você assumiu este atendimento');
    },
    onError: (error) => {
      toast.error('Erro ao atender: ' + error.message);
    },
  });
}
