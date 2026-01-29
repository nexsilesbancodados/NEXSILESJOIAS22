-- Add quantidade_vendida column to track sold quantities while keeping pending items in same record
-- This avoids the unique constraint issue with (maleta_id, peca_id)

ALTER TABLE public.maletas_pecas 
ADD COLUMN IF NOT EXISTS quantidade_vendida integer DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.maletas_pecas.quantidade_vendida IS 'Tracks number of units sold from this maleta item, separate from pending quantity';