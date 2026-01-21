-- Add promotional price column to pecas table
ALTER TABLE public.pecas
ADD COLUMN IF NOT EXISTS preco_promocional DECIMAL NULL;