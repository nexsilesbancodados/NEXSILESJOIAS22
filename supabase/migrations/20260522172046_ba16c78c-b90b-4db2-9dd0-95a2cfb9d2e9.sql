
-- ============= 1. METAS =============
CREATE TABLE IF NOT EXISTS public.revendedora_metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  revendedora_id UUID NOT NULL REFERENCES public.revendedoras(id) ON DELETE CASCADE,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INT NOT NULL CHECK (ano BETWEEN 2024 AND 2100),
  meta_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (revendedora_id, mes, ano)
);
ALTER TABLE public.revendedora_metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metas_org_select" ON public.revendedora_metas FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "metas_org_insert" ON public.revendedora_metas FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
CREATE POLICY "metas_org_update" ON public.revendedora_metas FOR UPDATE USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "metas_org_delete" ON public.revendedora_metas FOR DELETE USING (public.user_belongs_to_org(organization_id));
CREATE TRIGGER trg_metas_updated BEFORE UPDATE ON public.revendedora_metas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_metas_rev_periodo ON public.revendedora_metas(revendedora_id, ano, mes);

-- ============= 2. ACERTOS FINANCEIROS =============
CREATE TABLE IF NOT EXISTS public.maleta_acertos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  revendedora_id UUID REFERENCES public.revendedoras(id) ON DELETE SET NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro','pix','transferencia','cartao','fiado','parcelado','outro')),
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  parcelas INT DEFAULT 1,
  observacao TEXT,
  fiado_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maleta_acertos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acertos_org_select" ON public.maleta_acertos FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "acertos_org_insert" ON public.maleta_acertos FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
CREATE POLICY "acertos_org_delete" ON public.maleta_acertos FOR DELETE USING (public.user_belongs_to_org(organization_id));
CREATE INDEX idx_acertos_maleta ON public.maleta_acertos(maleta_id);

-- ============= 3. FOTOS DE VENDAS =============
INSERT INTO storage.buckets (id, name, public) VALUES ('maleta-vendas-fotos','maleta-vendas-fotos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "fotos_vendas_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'maleta-vendas-fotos');
CREATE POLICY "fotos_vendas_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'maleta-vendas-fotos');
CREATE POLICY "fotos_vendas_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'maleta-vendas-fotos');

CREATE TABLE IF NOT EXISTS public.maleta_venda_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  maleta_peca_id UUID REFERENCES public.maletas_pecas(id) ON DELETE CASCADE,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE SET NULL,
  foto_url TEXT NOT NULL,
  observacao TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maleta_venda_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fotos_org_select" ON public.maleta_venda_fotos FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "fotos_org_insert" ON public.maleta_venda_fotos FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
CREATE POLICY "fotos_org_delete" ON public.maleta_venda_fotos FOR DELETE USING (public.user_belongs_to_org(organization_id));
CREATE INDEX idx_fotos_maleta ON public.maleta_venda_fotos(maleta_id);

-- ============= 4. RPC: SUGERIR REPOSIÇÃO =============
CREATE OR REPLACE FUNCTION public.sugerir_reposicao_revendedora(p_revendedora_id UUID, p_limite INT DEFAULT 10)
RETURNS TABLE(peca_id UUID, nome TEXT, codigo TEXT, imagem_url TEXT, preco_venda NUMERIC, total_vendido BIGINT, estoque_atual INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_org UUID;
BEGIN
  SELECT organization_id INTO v_org FROM public.revendedoras WHERE id = p_revendedora_id;
  IF v_org IS NULL OR NOT public.user_belongs_to_org(v_org) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  RETURN QUERY
  SELECT p.id, p.nome, p.codigo, p.imagem_url, p.preco_venda,
         SUM(COALESCE(mp.quantidade_vendida,0))::BIGINT AS total_vendido,
         COALESCE(p.estoque,0) AS estoque_atual
  FROM public.maletas_pecas mp
  INNER JOIN public.maletas m ON mp.maleta_id = m.id
  INNER JOIN public.pecas p ON mp.peca_id = p.id
  WHERE m.revendedora_id = p_revendedora_id
    AND COALESCE(mp.quantidade_vendida,0) > 0
  GROUP BY p.id, p.nome, p.codigo, p.imagem_url, p.preco_venda, p.estoque
  ORDER BY total_vendido DESC
  LIMIT p_limite;
END; $$;

-- ============= 5. RPC: RANKING =============
CREATE OR REPLACE FUNCTION public.ranking_revendedoras_mes(p_organization_id UUID, p_mes INT, p_ano INT)
RETURNS TABLE(
  revendedora_id UUID,
  nome TEXT,
  total_vendido NUMERIC,
  total_pecas BIGINT,
  meta_valor NUMERIC,
  percentual_meta NUMERIC,
  badge TEXT,
  posicao BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.user_belongs_to_org(p_organization_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  RETURN QUERY
  WITH vendas AS (
    SELECT r.id AS rev_id, r.nome,
           COALESCE(SUM(mp.quantidade_vendida * COALESCE(mp.preco_unitario, p.preco_venda, 0)),0) AS total_val,
           COALESCE(SUM(mp.quantidade_vendida),0)::BIGINT AS total_pec
    FROM public.revendedoras r
    LEFT JOIN public.maletas m ON m.revendedora_id = r.id
    LEFT JOIN public.maletas_pecas mp ON mp.maleta_id = m.id
    LEFT JOIN public.pecas p ON p.id = mp.peca_id
    WHERE r.organization_id = p_organization_id
      AND (mp.data_venda IS NULL OR (EXTRACT(MONTH FROM mp.data_venda)=p_mes AND EXTRACT(YEAR FROM mp.data_venda)=p_ano))
    GROUP BY r.id, r.nome
  ),
  metas AS (
    SELECT rm.revendedora_id, rm.meta_valor FROM public.revendedora_metas rm
    WHERE rm.organization_id = p_organization_id AND rm.mes = p_mes AND rm.ano = p_ano
  )
  SELECT v.rev_id, v.nome, v.total_val, v.total_pec,
         COALESCE(mt.meta_valor, 0) AS meta_valor,
         CASE WHEN COALESCE(mt.meta_valor,0) > 0 THEN ROUND((v.total_val / mt.meta_valor * 100)::numeric, 1) ELSE 0 END AS percentual_meta,
         CASE
           WHEN COALESCE(mt.meta_valor,0) > 0 AND v.total_val >= mt.meta_valor THEN 'ouro'
           WHEN COALESCE(mt.meta_valor,0) > 0 AND v.total_val >= mt.meta_valor * 0.7 THEN 'prata'
           WHEN COALESCE(mt.meta_valor,0) > 0 AND v.total_val >= mt.meta_valor * 0.4 THEN 'bronze'
           ELSE 'sem_meta'
         END AS badge,
         ROW_NUMBER() OVER (ORDER BY v.total_val DESC) AS posicao
  FROM vendas v
  LEFT JOIN metas mt ON mt.revendedora_id = v.rev_id
  ORDER BY v.total_val DESC;
END; $$;
