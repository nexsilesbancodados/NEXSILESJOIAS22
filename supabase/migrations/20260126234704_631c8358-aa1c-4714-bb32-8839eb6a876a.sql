-- Add tracking fields to romaneios table
ALTER TABLE public.romaneios 
ADD COLUMN IF NOT EXISTS codigo_rastreio TEXT,
ADD COLUMN IF NOT EXISTS transportadora TEXT,
ADD COLUMN IF NOT EXISTS data_envio TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.romaneios.codigo_rastreio IS 'Código de rastreamento da transportadora';
COMMENT ON COLUMN public.romaneios.transportadora IS 'Nome da transportadora (Correios, Jadlog, etc)';
COMMENT ON COLUMN public.romaneios.data_envio IS 'Data em que o pedido foi enviado';