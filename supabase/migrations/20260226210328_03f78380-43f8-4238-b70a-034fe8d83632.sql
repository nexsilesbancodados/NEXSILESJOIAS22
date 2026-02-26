
-- Add new configuration columns to ecommerce_config
ALTER TABLE public.ecommerce_config
  ADD COLUMN IF NOT EXISTS banner_texto TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banner_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banner_cor TEXT DEFAULT '#B76E79',
  ADD COLUMN IF NOT EXISTS email_contato TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS facebook TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS politica_troca TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS politica_privacidade TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pedido_minimo NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mostrar_preco_original BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS avaliacoes_ativas BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS metodos_pagamento TEXT[] DEFAULT ARRAY['pix', 'cartao', 'boleto'],
  ADD COLUMN IF NOT EXISTS horario_funcionamento JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mensagem_whatsapp TEXT DEFAULT 'Olá! Vi sua loja e gostaria de mais informações.',
  ADD COLUMN IF NOT EXISTS mostrar_estoque BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS produtos_por_pagina INTEGER DEFAULT 12;
