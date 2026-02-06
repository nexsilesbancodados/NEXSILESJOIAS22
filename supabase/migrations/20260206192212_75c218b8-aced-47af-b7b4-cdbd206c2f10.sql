-- Add columns for agent customization
ALTER TABLE public.agente_ia_config 
ADD COLUMN IF NOT EXISTS ferramentas_ativas jsonb DEFAULT '{"consultar_estoque": true, "buscar_pecas": true, "gerar_pix": true, "enviar_whatsapp": true, "listar_catalogos": true, "criar_pedido": true, "verificar_pedido": true}'::jsonb,
ADD COLUMN IF NOT EXISTS tom_resposta text DEFAULT 'profissional',
ADD COLUMN IF NOT EXISTS idioma text DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 1024,
ADD COLUMN IF NOT EXISTS temperatura numeric DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS instrucoes_especiais text,
ADD COLUMN IF NOT EXISTS horario_funcionamento jsonb DEFAULT '{"ativo": false, "inicio": "09:00", "fim": "18:00", "dias": [1,2,3,4,5], "mensagem_fora": "Nosso atendimento funciona de segunda a sexta, das 9h às 18h."}'::jsonb,
ADD COLUMN IF NOT EXISTS respostas_rapidas jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS palavras_proibidas text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS limite_mensagens_sessao integer DEFAULT 50;