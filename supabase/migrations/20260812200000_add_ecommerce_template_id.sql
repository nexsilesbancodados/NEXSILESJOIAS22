-- Guarda qual preset visual foi usado pela loja para manter o editor consistente
-- entre sessões. O campo é apenas metadado de edição e não é exposto na view pública.
ALTER TABLE public.ecommerce_config
  ADD COLUMN IF NOT EXISTS template_id TEXT;

COMMENT ON COLUMN public.ecommerce_config.template_id IS
  'Identificador do template visual aplicado no editor da loja';
