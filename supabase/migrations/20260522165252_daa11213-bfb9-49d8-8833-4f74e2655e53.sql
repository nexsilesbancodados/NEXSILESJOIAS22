-- 1. Maletas: prazo e controle de alerta
ALTER TABLE public.maletas
  ADD COLUMN IF NOT EXISTS prazo_devolucao DATE,
  ADD COLUMN IF NOT EXISTS alerta_enviado_em TIMESTAMPTZ;

-- 2. Assinaturas de retirada (imutável)
CREATE TABLE IF NOT EXISTS public.maleta_assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  revendedora_id UUID,
  assinante_nome TEXT NOT NULL,
  assinatura_base64 TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  snapshot_itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maleta_assinaturas_maleta ON public.maleta_assinaturas(maleta_id);
CREATE INDEX IF NOT EXISTS idx_maleta_assinaturas_org ON public.maleta_assinaturas(organization_id);

ALTER TABLE public.maleta_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read assinaturas" ON public.maleta_assinaturas
  FOR SELECT USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "org members insert assinaturas" ON public.maleta_assinaturas
  FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));

-- Bloqueia update/delete (imutável)
CREATE POLICY "no update assinaturas" ON public.maleta_assinaturas
  FOR UPDATE USING (false);
CREATE POLICY "no delete assinaturas" ON public.maleta_assinaturas
  FOR DELETE USING (false);

-- 3. Comissão por categoria e por peça
ALTER TABLE public.categorias_pecas
  ADD COLUMN IF NOT EXISTS comissao_percentual NUMERIC(5,2);

ALTER TABLE public.pecas
  ADD COLUMN IF NOT EXISTS comissao_percentual_override NUMERIC(5,2);

-- 4. RPC hierarquia de comissão: peça > categoria > revendedora
CREATE OR REPLACE FUNCTION public.calcular_comissao_peca(
  p_peca_id UUID,
  p_revendedora_id UUID
) RETURNS NUMERIC
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_peca_override NUMERIC;
  v_categoria_id UUID;
  v_categoria_pct NUMERIC;
  v_revendedora_pct NUMERIC;
BEGIN
  SELECT comissao_percentual_override, categoria_id
    INTO v_peca_override, v_categoria_id
  FROM public.pecas WHERE id = p_peca_id;

  IF v_peca_override IS NOT NULL THEN
    RETURN v_peca_override;
  END IF;

  IF v_categoria_id IS NOT NULL THEN
    SELECT comissao_percentual INTO v_categoria_pct
    FROM public.categorias_pecas WHERE id = v_categoria_id;
    IF v_categoria_pct IS NOT NULL THEN
      RETURN v_categoria_pct;
    END IF;
  END IF;

  SELECT comissao_percentual INTO v_revendedora_pct
  FROM public.revendedoras WHERE id = p_revendedora_id;

  RETURN COALESCE(v_revendedora_pct, 0);
END;
$$;

-- 5. Listar maletas vencidas/paradas
CREATE OR REPLACE FUNCTION public.maletas_vencidas(p_dias_parada INT DEFAULT 30)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  numero_sequencial INT,
  revendedora_id UUID,
  revendedora_nome TEXT,
  prazo_devolucao DATE,
  dias_aberta INT,
  dias_vencida INT,
  status TEXT,
  organization_id UUID
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id, m.nome, m.numero_sequencial, m.revendedora_id,
    r.nome AS revendedora_nome,
    m.prazo_devolucao,
    GREATEST(0, (CURRENT_DATE - m.created_at::date))::int AS dias_aberta,
    CASE WHEN m.prazo_devolucao IS NOT NULL AND m.prazo_devolucao < CURRENT_DATE
         THEN (CURRENT_DATE - m.prazo_devolucao)::int ELSE 0 END AS dias_vencida,
    m.status, m.organization_id
  FROM public.maletas m
  LEFT JOIN public.revendedoras r ON r.id = m.revendedora_id
  WHERE m.status = 'ativa'
    AND public.user_belongs_to_org(m.organization_id)
    AND (
      (m.prazo_devolucao IS NOT NULL AND m.prazo_devolucao < CURRENT_DATE)
      OR (CURRENT_DATE - m.created_at::date) >= p_dias_parada
    )
  ORDER BY dias_vencida DESC, dias_aberta DESC;
$$;