-- ============================================================================
-- Hardening: configuração pública do agente e fila de webhooks
-- ============================================================================
-- A view pública seleciona somente campos de apresentação, mas a policy antiga
-- também liberava SELECT direto em agente_ia_config para anon. Isso expunha
-- colunas privadas, incluindo gemini_api_key. A view passa a executar com os
-- privilégios do owner e a tabela base deixa de ser acessível anonimamente.

CREATE OR REPLACE VIEW public.agente_ia_config_public
WITH (security_invoker = false) AS
SELECT
  organization_id,
  nome_agente,
  cor_primaria,
  avatar_url,
  mensagem_boas_vindas,
  ativo
FROM public.agente_ia_config
WHERE ativo = true;

DROP POLICY IF EXISTS "Public can read basic agent config"
  ON public.agente_ia_config;

REVOKE ALL ON TABLE public.agente_ia_config FROM anon;
GRANT SELECT ON public.agente_ia_config_public TO anon, authenticated;

-- The same historical mistake existed in ecommerce_config: its anonymous
-- row policy made the whole base row readable, including payment credentials.
-- Keep the public view as the only anonymous surface and expose only the
-- columns used by that view on the base table.
DROP POLICY IF EXISTS "Acesso anônimo à config ativa da loja"
  ON public.ecommerce_config;
REVOKE ALL ON TABLE public.ecommerce_config FROM anon;
ALTER VIEW public.ecommerce_config_public SET (security_invoker = false);
GRANT SELECT (
  id, slug, nome_loja, logo_url, cor_primaria, cor_secundaria, descricao,
  ativo, apenas_com_foto, frete_gratis_acima, taxa_entrega, whatsapp, instagram,
  banner_ativo, banner_texto, banner_cor, banner_url, banner_link, banner_posicao,
  mostrar_estoque, mostrar_preco_original, pedido_minimo, produtos_por_pagina,
  metodos_pagamento, email_contato, facebook, politica_troca, politica_privacidade,
  avaliacoes_ativas, horario_funcionamento, fonte_titulos, fonte_corpo,
  layout_produtos, colunas_desktop, colunas_mobile, mostrar_busca,
  mostrar_categorias, mostrar_filtros, mostrar_ordenacao, mostrar_whatsapp_float,
  whatsapp_posicao, selos_confianca, texto_rodape, google_analytics_id,
  facebook_pixel_id, css_personalizado, hero_titulo, hero_subtitulo,
  hero_cta_texto, hero_cta_link, hero_imagem_url, hero_overlay_opacity,
  parcelamento_max, mostrar_parcelamento, tempo_estimado_entrega, badges_produto,
  mensagem_whatsapp, mercadopago_public_key, pix_chave, pix_nome, pix_tipo,
  pix_cidade, organization_id, created_at, updated_at, banners_carousel,
  colecoes_destaque, secoes_homepage, countdown_ativo, countdown_titulo,
  countdown_subtitulo, countdown_data_fim, countdown_produto_ids, lookbook_ativo,
  lookbook_titulo, lookbook_imagens, produtos_destaque_ids, mais_vendidos_ids,
  popup_ativo, popup_titulo, popup_texto, popup_imagem_url, popup_cupom,
  popup_delay_segundos, barra_frete_ativo, mostrar_codigo_produto,
  zoom_imagem_ativo, produtos_relacionados_ativo, rodape_coluna1_titulo,
  rodape_coluna1_links, rodape_coluna2_titulo, rodape_coluna2_links,
  rodape_exibir_mapa, rodape_endereco, metodos_entrega, header_sticky,
  header_transparente_hero, cep_origem, custom_domain, custom_domain_status,
  seo_title, seo_description, seo_keywords, og_image_url
) ON public.ecommerce_config TO anon;

-- Payment IDs are idempotency keys. The partial indexes preserve existing
-- nullable rows while closing the select-then-insert race for real payments.
CREATE UNIQUE INDEX IF NOT EXISTS ecommerce_pedidos_mp_payment_id_key
  ON public.ecommerce_pedidos (mercadopago_payment_id)
  WHERE mercadopago_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS codigos_acesso_mp_payment_id_key
  ON public.codigos_acesso (mercadopago_payment_id)
  WHERE mercadopago_payment_id IS NOT NULL;

-- Do not silently turn an oversell into a zero balance. The row lock keeps
-- concurrent terminals consistent and the exception lets the caller abort
-- instead of recording a sale that cannot be fulfilled.
CREATE OR REPLACE FUNCTION public.ajustar_estoque_peca(
  p_peca_id UUID,
  p_delta INTEGER,
  p_permitir_negativo BOOLEAN DEFAULT false
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org UUID;
  v_estoque INTEGER;
  v_novo INTEGER;
BEGIN
  SELECT organization_id, COALESCE(estoque, 0)
    INTO v_org, v_estoque
    FROM public.pecas
   WHERE id = p_peca_id
   FOR UPDATE;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Peça não encontrada';
  END IF;
  IF NOT public.user_belongs_to_org(v_org) THEN
    RAISE EXCEPTION 'Sem permissão para movimentar o estoque desta peça';
  END IF;

  v_novo := v_estoque + p_delta;
  IF NOT p_permitir_negativo AND v_novo < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente para esta operação';
  END IF;

  UPDATE public.pecas
     SET estoque = v_novo, updated_at = now()
   WHERE id = p_peca_id;

  RETURN v_novo;
END;
$$;

REVOKE ALL ON FUNCTION public.ajustar_estoque_peca(UUID, INTEGER, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ajustar_estoque_peca(UUID, INTEGER, BOOLEAN) TO authenticated;

-- O processador da fila usa service_role e pode gerar códigos de acesso e
-- confirmar pagamentos. Ele não deve ser acionável por qualquer visitante.
-- A Edge Function aceita service_role para chamadas internas e x-cron-secret
-- para o pg_cron/Vault.
