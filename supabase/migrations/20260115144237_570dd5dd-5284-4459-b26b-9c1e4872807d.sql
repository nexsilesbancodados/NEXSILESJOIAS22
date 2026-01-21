-- Add customization fields to catalogos table
ALTER TABLE public.catalogos 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#D4AF37',
ADD COLUMN IF NOT EXISTS cor_secundaria TEXT DEFAULT '#1a1a2e',
ADD COLUMN IF NOT EXISTS titulo TEXT,
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS mensagem_boas_vindas TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS email_contato TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add customization fields to maletas table
ALTER TABLE public.maletas
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS comissao_personalizada NUMERIC,
ADD COLUMN IF NOT EXISTS prazo_devolucao DATE,
ADD COLUMN IF NOT EXISTS observacoes TEXT;