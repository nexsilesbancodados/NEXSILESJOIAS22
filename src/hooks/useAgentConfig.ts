import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentConfig {
  id: string;
  organization_id: string;
  nome_agente: string;
  prompt_sistema: string;
  cor_primaria: string;
  avatar_url: string | null;
  mensagem_boas_vindas: string;
  ativo: boolean;
  pix_chave: string | null;
  pix_tipo: string;
  pix_nome: string | null;
  whatsapp_numero: string | null;
}

export function useAgentConfig(organizationId: string) {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['agent-config', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('agente_ia_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching agent config:', error);
        return null;
      }

      return data as AgentConfig | null;
    },
    enabled: !!organizationId
  });

  const saveConfig = useMutation({
    mutationFn: async (configData: Partial<AgentConfig>) => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { data: existing } = await supabase
        .from('agente_ia_config')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('agente_ia_config')
          .update({
            ...configData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agente_ia_config')
          .insert({
            ...configData,
            organization_id: organizationId
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-config', organizationId] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving agent config:', error);
      toast.error('Erro ao salvar configurações');
    }
  });

  return {
    config,
    isLoading,
    saveConfig
  };
}
