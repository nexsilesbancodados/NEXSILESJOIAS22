-- Adicionar campo de mínimo de peças para fechar pedido no catálogo
ALTER TABLE public.catalogos 
ADD COLUMN IF NOT EXISTS pedido_minimo_pecas integer DEFAULT 0;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.catalogos.pedido_minimo_pecas IS 'Quantidade mínima de peças para fechar um pedido';