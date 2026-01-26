-- Add cliente_telefone field to romaneios table for WhatsApp notifications
ALTER TABLE public.romaneios 
ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.romaneios.cliente_telefone IS 'Telefone do cliente para notificações de rastreio';