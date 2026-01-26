import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export interface WhatsAppTemplate {
  id: string;
  organization_id: string;
  nome: string;
  mensagem: string;
  categoria: string;
  variaveis: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  nome: string;
  mensagem: string;
  categoria?: string;
  variaveis?: string[];
}

export interface UpdateTemplateData {
  id: string;
  nome?: string;
  mensagem?: string;
  categoria?: string;
  variaveis?: string[];
  ativo?: boolean;
}

export function useWhatsAppTemplates() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['whatsapp-templates', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await db
        .from('whatsapp_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return (data || []) as WhatsAppTemplate[];
    },
    enabled: !!organizationId,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      if (!organizationId) throw new Error('Organization ID is required');
      
      const { data, error } = await db
        .from('whatsapp_templates')
        .insert({
          organization_id: organizationId,
          nome: templateData.nome,
          mensagem: templateData.mensagem,
          categoria: templateData.categoria || 'personalizado',
          variaveis: templateData.variaveis || [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Template salvo com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTemplateData) => {
      const { data, error } = await db
        .from('whatsapp_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Template atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('whatsapp_templates')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Template excluído!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir template: ${error.message}`);
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
