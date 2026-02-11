import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FerramentasAtivas {
  consultar_estoque: boolean;
  buscar_pecas: boolean;
  gerar_pix: boolean;
  enviar_whatsapp: boolean;
  listar_catalogos: boolean;
  criar_pedido: boolean;
  verificar_pedido: boolean;
}

interface HorarioFuncionamento {
  ativo: boolean;
  inicio: string;
  fim: string;
  dias: number[];
  mensagem_fora: string;
  modo_24h?: boolean;
}

interface RespostaRapida {
  gatilho: string;
  resposta: string;
}

export interface AlertasConfig {
  nova_venda: boolean;
  novo_pedido: boolean;
  atendimento_humano: boolean;
  nps_negativo: boolean;
  lead_quente: boolean;
  conversa_encerrada: boolean;
  erro_agente: boolean;
  estoque_baixo: boolean;
  follow_up_pendente: boolean;
}

export interface AgentConfig {
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
  whatsapp_instancia: string | null;
  ferramentas_ativas: FerramentasAtivas;
  tom_resposta: string;
  idioma: string;
  max_tokens: number;
  temperatura: number;
  instrucoes_especiais: string | null;
  horario_funcionamento: HorarioFuncionamento;
  respostas_rapidas: RespostaRapida[];
  palavras_proibidas: string[];
  limite_mensagens_sessao: number;
  gemini_api_key: string | null;
  dono_whatsapp: string | null;
  dono_email: string | null;
  dono_nome: string | null;
  alertas_config: AlertasConfig;
}

const defaultConfig: Partial<AgentConfig> = {
  nome_agente: 'Assistente Virtual',
  prompt_sistema: 'Você é um assistente virtual de uma joalheria. Ajude os clientes com informações sobre produtos, pedidos e pagamentos.',
  cor_primaria: '#9b87f5',
  mensagem_boas_vindas: 'Olá! 👋 Como posso ajudar você hoje?',
  ativo: true,
  pix_tipo: 'email',
  ferramentas_ativas: {
    consultar_estoque: true,
    buscar_pecas: true,
    gerar_pix: true,
    enviar_whatsapp: true,
    listar_catalogos: true,
    criar_pedido: true,
    verificar_pedido: true
  },
  tom_resposta: 'profissional',
  idioma: 'pt-BR',
  max_tokens: 1024,
  temperatura: 0.7,
  horario_funcionamento: {
    ativo: false,
    inicio: '09:00',
    fim: '18:00',
    dias: [1, 2, 3, 4, 5],
    mensagem_fora: 'Nosso atendimento funciona de segunda a sexta, das 9h às 18h.'
  },
  respostas_rapidas: [],
  palavras_proibidas: [],
  limite_mensagens_sessao: 50,
  gemini_api_key: null,
  dono_whatsapp: null,
  dono_email: null,
  dono_nome: null,
  alertas_config: {
    nova_venda: true,
    novo_pedido: true,
    atendimento_humano: true,
    nps_negativo: true,
    lead_quente: true,
    conversa_encerrada: false,
    erro_agente: true,
    estoque_baixo: true,
    follow_up_pendente: false,
  }
};

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

      if (!data) return defaultConfig as AgentConfig;

      // Merge with defaults to handle missing fields
      const ferramentas = data.ferramentas_ativas as unknown as FerramentasAtivas | null;
      const horario = data.horario_funcionamento as unknown as HorarioFuncionamento | null;
      const respostas = data.respostas_rapidas as unknown as RespostaRapida[] | null;
      const alertas = data.alertas_config as unknown as AlertasConfig | null;

      return {
        ...defaultConfig,
        ...data,
        ferramentas_ativas: {
          ...defaultConfig.ferramentas_ativas,
          ...(ferramentas || {})
        },
        horario_funcionamento: {
          ...defaultConfig.horario_funcionamento,
          ...(horario || {})
        },
        respostas_rapidas: respostas || [],
        palavras_proibidas: data.palavras_proibidas || [],
        gemini_api_key: data.gemini_api_key || null,
        dono_whatsapp: (data as any).dono_whatsapp || null,
        dono_email: (data as any).dono_email || null,
        dono_nome: (data as any).dono_nome || null,
        alertas_config: {
          ...defaultConfig.alertas_config,
          ...(alertas || {})
        },
      } as AgentConfig;
    },
    enabled: !!organizationId
  });

  const saveConfig = useMutation({
    mutationFn: async (configData: Partial<AgentConfig>) => {
      if (!organizationId) throw new Error('Organization ID is required');

      // Convert to database format
      const dbData: Record<string, unknown> = {
        ...configData,
        ferramentas_ativas: configData.ferramentas_ativas as unknown,
        horario_funcionamento: configData.horario_funcionamento as unknown,
        respostas_rapidas: configData.respostas_rapidas as unknown,
        alertas_config: configData.alertas_config as unknown
      };

      // Remove id and organization_id from update data
      delete dbData.id;
      delete dbData.organization_id;

      const { data: existing } = await supabase
        .from('agente_ia_config')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('agente_ia_config')
          .update({
            ...dbData,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agente_ia_config')
          .insert({
            ...dbData,
            organization_id: organizationId
          } as any);

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
    saveConfig,
    defaultConfig
  };
}
