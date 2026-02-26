-- Recreate the public view to include apenas_com_foto and other config fields
DROP VIEW IF EXISTS public.ecommerce_config_public;

CREATE VIEW public.ecommerce_config_public
WITH (security_invoker=on) AS
  SELECT 
    id, slug, nome_loja, logo_url, cor_primaria, cor_secundaria, 
    descricao, ativo, frete_gratis_acima, taxa_entrega, 
    whatsapp, instagram, organization_id,
    apenas_com_foto,
    banner_ativo, banner_texto, banner_cor,
    mostrar_estoque, mostrar_preco_original,
    produtos_por_pagina, pedido_minimo,
    metodos_pagamento, email_contato, facebook,
    politica_troca, politica_privacidade,
    avaliacoes_ativas, horario_funcionamento
  FROM public.ecommerce_config
  WHERE ativo = true;