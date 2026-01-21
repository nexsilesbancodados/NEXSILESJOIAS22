-- Add wholesale pricing columns to pecas table
ALTER TABLE public.pecas
ADD COLUMN IF NOT EXISTS preco_atacado DECIMAL NULL,
ADD COLUMN IF NOT EXISTS qtd_min_atacado INTEGER NULL;