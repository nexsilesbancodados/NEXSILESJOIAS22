-- Adicionar campo para nome/descrição da peça manual na tabela envio_galvanica_itens
ALTER TABLE public.envio_galvanica_itens 
ADD COLUMN IF NOT EXISTS nome_peca TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.envio_galvanica_itens.nome_peca IS 'Nome/descrição da peça quando cadastrada manualmente (sem vínculo com tabela pecas)';