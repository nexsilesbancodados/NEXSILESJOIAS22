DROP VIEW IF EXISTS public.ecommerce_config_public;

CREATE VIEW public.ecommerce_config_public
WITH (security_invoker = on)
AS
SELECT 
  id, slug, nome_loja, logo_url, cor_primaria, cor_secundaria, descricao,
  ativo, frete_gratis_acima, taxa_entrega, whatsapp, instagram, organization_id,
  apenas_com_foto, banner_ativo, banner_texto, banner_cor, banner_url, banner_link, banner_posicao,
  mostrar_estoque, mostrar_preco_original, produtos_por_pagina, pedido_minimo,
  metodos_pagamento, email_contato, facebook, politica_troca, politica_privacidade,
  avaliacoes_ativas, horario_funcionamento,
  fonte_titulos, fonte_corpo, layout_produtos, colunas_desktop, colunas_mobile,
  mostrar_busca, mostrar_categorias, mostrar_filtros, mostrar_ordenacao,
  mostrar_whatsapp_float, whatsapp_posicao, selos_confianca, texto_rodape,
  google_analytics_id, facebook_pixel_id, css_personalizado,
  hero_titulo, hero_subtitulo, hero_cta_texto, hero_cta_link,
  hero_imagem_url, hero_overlay_opacity,
  parcelamento_max, mostrar_parcelamento, tempo_estimado_entrega,
  badges_produto, mensagem_whatsapp,
  mercadopago_public_key,
  pix_chave, pix_nome, pix_tipo, pix_cidade
FROM ecommerce_config
WHERE ativo = true;

GRANT SELECT ON public.ecommerce_config_public TO anon;
GRANT SELECT ON public.ecommerce_config_public TO authenticated;