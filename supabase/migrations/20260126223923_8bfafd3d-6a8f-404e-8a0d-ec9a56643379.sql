-- Add column to mark pieces as catalog-only (not visible in main stock)
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS catalogo_only boolean DEFAULT false;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_pecas_catalogo_only ON public.pecas(catalogo_only) WHERE catalogo_only = false;