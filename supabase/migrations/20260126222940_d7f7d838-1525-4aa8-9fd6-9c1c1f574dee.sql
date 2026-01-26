-- Add missing columns to catalogos table
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS status text DEFAULT 'em_preparacao';
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS observacao text;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS custo_separacao numeric DEFAULT 0;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS custo_operacional numeric DEFAULT 0;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS taxa_entrega numeric DEFAULT 0;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS imagem_url text;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS pedido_minimo_pecas integer DEFAULT 0;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#D4AF37';
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS cor_secundaria text DEFAULT '#1a1a2e';
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS titulo text;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS mensagem_boas_vindas text;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS email_contato text;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS banner_url text;