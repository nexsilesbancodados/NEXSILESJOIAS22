
-- CORREÇÃO 1: Adicionar is_super_admin na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- CORREÇÃO 3: Adicionar cep_origem na tabela ecommerce_config
ALTER TABLE public.ecommerce_config ADD COLUMN IF NOT EXISTS cep_origem TEXT;
