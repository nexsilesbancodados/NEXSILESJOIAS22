-- Adicionar coluna quantidade na tabela catalogos_pecas
ALTER TABLE public.catalogos_pecas 
ADD COLUMN quantidade INTEGER NOT NULL DEFAULT 1;