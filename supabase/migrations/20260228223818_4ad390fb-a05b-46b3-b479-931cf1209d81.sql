
-- Adicionar campos para OAuth Marketplace do Mercado Pago
ALTER TABLE public.ecommerce_config 
  ADD COLUMN IF NOT EXISTS mp_user_id text,
  ADD COLUMN IF NOT EXISTS commission_fee numeric DEFAULT 0;
