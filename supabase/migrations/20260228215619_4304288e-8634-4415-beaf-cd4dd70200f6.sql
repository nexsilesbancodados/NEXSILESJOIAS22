-- Add footer configuration columns to ecommerce_config
ALTER TABLE public.ecommerce_config 
ADD COLUMN IF NOT EXISTS rodape_coluna1_titulo TEXT,
ADD COLUMN IF NOT EXISTS rodape_coluna1_links JSONB,
ADD COLUMN IF NOT EXISTS rodape_coluna2_titulo TEXT,
ADD COLUMN IF NOT EXISTS rodape_coluna2_links JSONB,
ADD COLUMN IF NOT EXISTS rodape_endereco TEXT,
ADD COLUMN IF NOT EXISTS rodape_exibir_mapa BOOLEAN DEFAULT false;