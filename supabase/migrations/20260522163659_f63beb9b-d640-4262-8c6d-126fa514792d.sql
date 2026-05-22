-- 1. ETIQUETAS: nada novo no DB (gera no frontend a partir de codigo/codigo_barras já existentes)

-- 2. TRANSFERÊNCIA DE ITENS ENTRE MALETAS
CREATE TABLE IF NOT EXISTS public.maleta_transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  maleta_origem_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  maleta_destino_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  observacao TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maleta_transferencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read transferencias" ON public.maleta_transferencias FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "org members insert transferencias" ON public.maleta_transferencias FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));

-- RPC: transferir peças entre maletas atomicamente
CREATE OR REPLACE FUNCTION public.transferir_peca_entre_maletas(
  p_maleta_origem_id UUID,
  p_maleta_destino_id UUID,
  p_peca_id UUID,
  p_quantidade INTEGER,
  p_observacao TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID;
  v_origem RECORD;
  v_destino_existente RECORD;
  v_transferencia_id UUID;
BEGIN
  -- Pega organização e valida posse
  SELECT m.organization_id INTO v_org FROM public.maletas m WHERE m.id = p_maleta_origem_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Maleta origem não encontrada'; END IF;
  IF NOT public.user_belongs_to_org(v_org) THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  -- Item na maleta origem
  SELECT id, quantidade, preco_unitario INTO v_origem
  FROM public.maletas_pecas
  WHERE maleta_id = p_maleta_origem_id AND peca_id = p_peca_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Peça não está na maleta origem'; END IF;
  IF v_origem.quantidade < p_quantidade THEN RAISE EXCEPTION 'Quantidade insuficiente na origem (% disponível)', v_origem.quantidade; END IF;

  -- Decrementa origem (ou remove se zerar)
  IF v_origem.quantidade = p_quantidade THEN
    DELETE FROM public.maletas_pecas WHERE id = v_origem.id;
  ELSE
    UPDATE public.maletas_pecas SET quantidade = quantidade - p_quantidade, updated_at = now() WHERE id = v_origem.id;
  END IF;

  -- Adiciona/incrementa destino
  SELECT id, quantidade INTO v_destino_existente
  FROM public.maletas_pecas WHERE maleta_id = p_maleta_destino_id AND peca_id = p_peca_id;
  IF FOUND THEN
    UPDATE public.maletas_pecas SET quantidade = quantidade + p_quantidade, updated_at = now() WHERE id = v_destino_existente.id;
  ELSE
    INSERT INTO public.maletas_pecas (maleta_id, peca_id, quantidade, preco_unitario)
    VALUES (p_maleta_destino_id, p_peca_id, p_quantidade, v_origem.preco_unitario);
  END IF;

  -- Log
  INSERT INTO public.maleta_transferencias (organization_id, maleta_origem_id, maleta_destino_id, peca_id, quantidade, observacao, user_id)
  VALUES (v_org, p_maleta_origem_id, p_maleta_destino_id, p_peca_id, p_quantidade, p_observacao, auth.uid())
  RETURNING id INTO v_transferencia_id;

  RETURN v_transferencia_id;
END; $$;

-- 3. REABRIR MALETA FECHADA (estorno)
CREATE TABLE IF NOT EXISTS public.maleta_reaberturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  motivo TEXT,
  user_id UUID,
  estorno_devolucoes JSONB,
  estorno_conferencia_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maleta_reaberturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read reaberturas" ON public.maleta_reaberturas FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "org members insert reaberturas" ON public.maleta_reaberturas FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE OR REPLACE FUNCTION public.reabrir_maleta(
  p_maleta_id UUID,
  p_motivo TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID;
  v_status TEXT;
  v_devolucoes JSONB;
  v_dev RECORD;
  v_conf_id UUID;
  v_reabertura_id UUID;
BEGIN
  SELECT organization_id, status INTO v_org, v_status FROM public.maletas WHERE id = p_maleta_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Maleta não encontrada'; END IF;
  IF NOT public.user_belongs_to_org(v_org) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v_status NOT IN ('fechada','finalizada','encerrada') THEN RAISE EXCEPTION 'Maleta não está fechada'; END IF;

  -- Coleta devoluções para snapshot e estorna estoque
  SELECT COALESCE(jsonb_agg(to_jsonb(d.*)), '[]'::jsonb) INTO v_devolucoes
  FROM public.maleta_devolucoes d WHERE d.maleta_id = p_maleta_id;

  -- Reverte estoque: devolve para a maleta as peças que tinham sido retornadas ao estoque
  FOR v_dev IN
    SELECT peca_id, SUM(quantidade) AS qtd FROM public.maleta_devolucoes
    WHERE maleta_id = p_maleta_id GROUP BY peca_id
  LOOP
    -- decrementa estoque (porque será re-emprestado à maleta)
    UPDATE public.pecas SET estoque = GREATEST(0, COALESCE(estoque,0) - v_dev.qtd) WHERE id = v_dev.peca_id;
    -- repõe na maleta
    IF EXISTS (SELECT 1 FROM public.maletas_pecas WHERE maleta_id = p_maleta_id AND peca_id = v_dev.peca_id) THEN
      UPDATE public.maletas_pecas SET quantidade = quantidade + v_dev.qtd, updated_at = now()
      WHERE maleta_id = p_maleta_id AND peca_id = v_dev.peca_id;
    ELSE
      INSERT INTO public.maletas_pecas (maleta_id, peca_id, quantidade)
      VALUES (p_maleta_id, v_dev.peca_id, v_dev.qtd);
    END IF;
  END LOOP;

  -- Marca conferência mais recente como estornada (mantém histórico)
  SELECT id INTO v_conf_id FROM public.maleta_conferencias
  WHERE maleta_id = p_maleta_id ORDER BY created_at DESC LIMIT 1;

  -- Limpa devoluções
  DELETE FROM public.maleta_devolucoes WHERE maleta_id = p_maleta_id;

  -- Reabre maleta
  UPDATE public.maletas SET status = 'ativa', updated_at = now() WHERE id = p_maleta_id;

  -- Log
  INSERT INTO public.maleta_reaberturas (organization_id, maleta_id, motivo, user_id, estorno_devolucoes, estorno_conferencia_id)
  VALUES (v_org, p_maleta_id, p_motivo, auth.uid(), v_devolucoes, v_conf_id)
  RETURNING id INTO v_reabertura_id;

  RETURN v_reabertura_id;
END; $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_transferencias_org ON public.maleta_transferencias(organization_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_origem ON public.maleta_transferencias(maleta_origem_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_destino ON public.maleta_transferencias(maleta_destino_id);
CREATE INDEX IF NOT EXISTS idx_reaberturas_maleta ON public.maleta_reaberturas(maleta_id);