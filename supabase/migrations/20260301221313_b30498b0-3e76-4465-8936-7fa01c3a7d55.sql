-- Recreate the ecommerce_config_public view to include cep_origem
DROP VIEW IF EXISTS ecommerce_config_public;

CREATE VIEW ecommerce_config_public WITH (security_invoker = on) AS
SELECT 
  id, slug, nome_loja, logo_url, cor_primaria, cor_secundaria, descricao,
  ativo, apenas_com_foto, frete_gratis_acima, taxa_entrega,
  whatsapp, instagram, banner_ativo, banner_texto, banner_cor,
  banner_url, banner_link, banner_posicao,
  mostrar_estoque, mostrar_preco_original, pedido_minimo, produtos_por_pagina,
  metodos_pagamento, email_contato, facebook, politica_troca, politica_privacidade,
  avaliacoes_ativas, horario_funcionamento,
  fonte_titulos, fonte_corpo, layout_produtos, colunas_desktop, colunas_mobile,
  mostrar_busca, mostrar_categorias, mostrar_filtros, mostrar_ordenacao,
  mostrar_whatsapp_float, whatsapp_posicao,
  selos_confianca, texto_rodape,
  google_analytics_id, facebook_pixel_id, css_personalizado,
  hero_titulo, hero_subtitulo, hero_cta_texto, hero_cta_link,
  hero_imagem_url, hero_overlay_opacity,
  parcelamento_max, mostrar_parcelamento, tempo_estimado_entrega,
  badges_produto, mensagem_whatsapp, mercadopago_public_key,
  pix_chave, pix_nome, pix_tipo, pix_cidade,
  organization_id, created_at, updated_at,
  banners_carousel, colecoes_destaque, secoes_homepage,
  countdown_ativo, countdown_titulo, countdown_subtitulo, countdown_data_fim, countdown_produto_ids,
  lookbook_ativo, lookbook_titulo, lookbook_imagens,
  produtos_destaque_ids, mais_vendidos_ids,
  popup_ativo, popup_titulo, popup_texto, popup_imagem_url, popup_cupom, popup_delay_segundos,
  barra_frete_ativo, mostrar_codigo_produto, zoom_imagem_ativo, produtos_relacionados_ativo,
  rodape_coluna1_titulo, rodape_coluna1_links, rodape_coluna2_titulo, rodape_coluna2_links,
  rodape_exibir_mapa, rodape_endereco,
  metodos_entrega, header_sticky, header_transparente_hero,
  cep_origem
FROM ecommerce_config;