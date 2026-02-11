-- Add gemini_api_key column to agente_ia_config
ALTER TABLE public.agente_ia_config
ADD COLUMN gemini_api_key text NULL;