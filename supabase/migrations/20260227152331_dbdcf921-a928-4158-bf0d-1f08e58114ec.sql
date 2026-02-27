
-- Add Mercado Pago credentials per organization to ecommerce_config
ALTER TABLE public.ecommerce_config 
ADD COLUMN IF NOT EXISTS mercadopago_access_token text,
ADD COLUMN IF NOT EXISTS mercadopago_public_key text;

-- Update the public view to include public_key (but NOT access_token)
-- The access_token should never be exposed publicly
