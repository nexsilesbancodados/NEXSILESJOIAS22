-- Add whatsapp_instancia column to agente_ia_config for Evolution API instance name
ALTER TABLE public.agente_ia_config 
ADD COLUMN IF NOT EXISTS whatsapp_instancia TEXT DEFAULT 'default';