-- Adicionar coluna quantidade_minima para pedido mínimo por peça no catálogo
ALTER TABLE public.catalogos_pecas 
ADD COLUMN quantidade_minima INTEGER NOT NULL DEFAULT 1;