
-- Banners múltiplos (carrossel de banners)
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS banners_carousel JSONB DEFAULT '[]'::jsonb;

-- Coleções em destaque
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS colecoes_destaque JSONB DEFAULT '[]'::jsonb;

-- Seções da página inicial (ordem e visibilidade)
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS secoes_homepage JSONB DEFAULT '[]'::jsonb;

-- Countdown/Promoção com timer
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS countdown_ativo BOOLEAN DEFAULT false;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS countdown_titulo TEXT;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS countdown_subtitulo TEXT;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS countdown_data_fim TIMESTAMP WITH TIME ZONE;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS countdown_produto_ids JSONB DEFAULT '[]'::jsonb;

-- Lookbook
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS lookbook_ativo BOOLEAN DEFAULT false;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS lookbook_titulo TEXT DEFAULT 'Lookbook';
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS lookbook_imagens JSONB DEFAULT '[]'::jsonb;

-- Produtos em destaque e mais vendidos
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS produtos_destaque_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS mais_vendidos_ids JSONB DEFAULT '[]'::jsonb;

-- Popup de boas-vindas
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS popup_ativo BOOLEAN DEFAULT false;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS popup_titulo TEXT;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS popup_texto TEXT;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS popup_imagem_url TEXT;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS popup_cupom TEXT;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS popup_delay_segundos INTEGER DEFAULT 5;

-- Barra de frete grátis progressiva
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS barra_frete_ativo BOOLEAN DEFAULT true;

-- Configurações de produto
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS mostrar_codigo_produto BOOLEAN DEFAULT false;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS zoom_imagem_ativo BOOLEAN DEFAULT true;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS produtos_relacionados_ativo BOOLEAN DEFAULT true;

-- Rodapé personalizado
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS rodape_coluna1_titulo TEXT;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS rodape_coluna1_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS rodape_coluna2_titulo TEXT;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS rodape_coluna2_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS rodape_exibir_mapa BOOLEAN DEFAULT false;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS rodape_endereco TEXT;

-- Métodos de entrega personalizados
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS metodos_entrega JSONB DEFAULT '[]'::jsonb;

-- Header
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS header_sticky BOOLEAN DEFAULT true;
ALTER TABLE ecommerce_config ADD COLUMN IF NOT EXISTS header_transparente_hero BOOLEAN DEFAULT false;

-- Atualizar a view pública para incluir os novos campos (sem expor o access_token)
DROP VIEW IF EXISTS ecommerce_config_public;
CREATE VIEW ecommerce_config_public WITH (security_invoker=on) AS
SELECT 
  id, slug, nome_loja, logo_url, cor_primaria, cor_secundaria, descricao,
  ativo, apenas_com_foto, frete_gratis_acima, taxa_entrega, whatsapp, instagram,
  banner_ativo, banner_texto, banner_cor, banner_url, banner_link, banner_posicao,
  mostrar_estoque, mostrar_preco_original, pedido_minimo, produtos_por_pagina,
  metodos_pagamento, email_contato, facebook, politica_troca, politica_privacidade,
  avaliacoes_ativas, horario_funcionamento, fonte_titulos, fonte_corpo,
  layout_produtos, colunas_desktop, colunas_mobile, mostrar_busca, mostrar_categorias,
  mostrar_filtros, mostrar_ordenacao, mostrar_whatsapp_float, whatsapp_posicao,
  selos_confianca, texto_rodape, google_analytics_id, facebook_pixel_id,
  css_personalizado, hero_titulo, hero_subtitulo, hero_cta_texto, hero_cta_link,
  hero_imagem_url, hero_overlay_opacity, parcelamento_max, mostrar_parcelamento,
  tempo_estimado_entrega, badges_produto, mensagem_whatsapp,
  mercadopago_public_key, pix_chave, pix_nome, pix_tipo, pix_cidade,
  organization_id, created_at, updated_at,
  -- Novos campos
  banners_carousel, colecoes_destaque, secoes_homepage,
  countdown_ativo, countdown_titulo, countdown_subtitulo, countdown_data_fim, countdown_produto_ids,
  lookbook_ativo, lookbook_titulo, lookbook_imagens,
  produtos_destaque_ids, mais_vendidos_ids,
  popup_ativo, popup_titulo, popup_texto, popup_imagem_url, popup_cupom, popup_delay_segundos,
  barra_frete_ativo, mostrar_codigo_produto, zoom_imagem_ativo, produtos_relacionados_ativo,
  rodape_coluna1_titulo, rodape_coluna1_links, rodape_coluna2_titulo, rodape_coluna2_links,
  rodape_exibir_mapa, rodape_endereco, metodos_entrega, header_sticky, header_transparente_hero
FROM ecommerce_config;
