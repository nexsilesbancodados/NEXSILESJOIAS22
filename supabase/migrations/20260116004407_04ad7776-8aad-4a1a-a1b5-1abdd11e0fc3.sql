-- Adicionar campos de endereço para pedidos do catálogo
ALTER TABLE public.pedidos_catalogo 
ADD COLUMN IF NOT EXISTS endereco_logradouro text,
ADD COLUMN IF NOT EXISTS endereco_numero text,
ADD COLUMN IF NOT EXISTS endereco_complemento text,
ADD COLUMN IF NOT EXISTS endereco_bairro text,
ADD COLUMN IF NOT EXISTS endereco_cidade text,
ADD COLUMN IF NOT EXISTS endereco_estado text,
ADD COLUMN IF NOT EXISTS endereco_cep text;

COMMENT ON COLUMN public.pedidos_catalogo.endereco_logradouro IS 'Logradouro do endereço de entrega';
COMMENT ON COLUMN public.pedidos_catalogo.endereco_numero IS 'Número do endereço de entrega';
COMMENT ON COLUMN public.pedidos_catalogo.endereco_complemento IS 'Complemento do endereço de entrega';
COMMENT ON COLUMN public.pedidos_catalogo.endereco_bairro IS 'Bairro do endereço de entrega';
COMMENT ON COLUMN public.pedidos_catalogo.endereco_cidade IS 'Cidade do endereço de entrega';
COMMENT ON COLUMN public.pedidos_catalogo.endereco_estado IS 'Estado (UF) do endereço de entrega';
COMMENT ON COLUMN public.pedidos_catalogo.endereco_cep IS 'CEP do endereço de entrega';