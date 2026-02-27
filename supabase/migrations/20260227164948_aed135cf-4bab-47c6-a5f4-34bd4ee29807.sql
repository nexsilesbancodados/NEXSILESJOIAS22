-- Add PIX fields to ecommerce_config for direct PIX payments
ALTER TABLE public.ecommerce_config
ADD COLUMN IF NOT EXISTS pix_chave text,
ADD COLUMN IF NOT EXISTS pix_nome text,
ADD COLUMN IF NOT EXISTS pix_tipo text DEFAULT 'cpf',
ADD COLUMN IF NOT EXISTS pix_cidade text DEFAULT 'SAO PAULO';
