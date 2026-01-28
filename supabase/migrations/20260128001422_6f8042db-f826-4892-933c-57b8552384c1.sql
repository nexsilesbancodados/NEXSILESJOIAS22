-- Adicionar coluna nome_peca para suportar peças cadastradas manualmente
ALTER TABLE public.envio_galvanica_itens 
ADD COLUMN IF NOT EXISTS nome_peca text;