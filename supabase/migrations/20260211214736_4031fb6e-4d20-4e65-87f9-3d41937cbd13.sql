-- Add owner notification settings to agente_ia_config
ALTER TABLE public.agente_ia_config
ADD COLUMN IF NOT EXISTS dono_whatsapp text,
ADD COLUMN IF NOT EXISTS dono_email text,
ADD COLUMN IF NOT EXISTS dono_nome text,
ADD COLUMN IF NOT EXISTS alertas_config jsonb DEFAULT '{
  "nova_venda": true,
  "novo_pedido": true,
  "atendimento_humano": true,
  "nps_negativo": true,
  "lead_quente": true,
  "conversa_encerrada": false,
  "erro_agente": true,
  "estoque_baixo": true,
  "follow_up_pendente": false
}'::jsonb;