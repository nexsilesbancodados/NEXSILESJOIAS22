-- Drop and recreate the catalogos_public view with all necessary fields
DROP VIEW IF EXISTS public.catalogos_public;

CREATE VIEW public.catalogos_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    nome,
    descricao,
    slug,
    imagem_url,
    imagem_capa,
    banner_url,
    logo_url,
    cor_primaria,
    cor_secundaria,
    mensagem_boas_vindas,
    titulo,
    ativo,
    data_validade,
    status,
    organization_id,
    custo_separacao,
    custo_operacional,
    taxa_entrega,
    pedido_minimo_pecas,
    whatsapp,
    email_contato,
    created_at,
    updated_at
  FROM catalogos
  WHERE ativo = true AND slug IS NOT NULL;