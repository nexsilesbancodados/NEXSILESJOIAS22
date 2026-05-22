
-- ============================================================================
-- 1. MALETAS_PECAS: novas colunas
-- ============================================================================
ALTER TABLE public.maletas_pecas
  ADD COLUMN IF NOT EXISTS quantidade_inicial INTEGER,
  ADD COLUMN IF NOT EXISTS quantidade_devolvida INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_perdida INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motivo_perda TEXT,
  ADD COLUMN IF NOT EXISTS preco_unitario_snapshot NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS nome_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS codigo_snapshot TEXT;

-- Backfill quantidade_inicial
UPDATE public.maletas_pecas
SET quantidade_inicial = COALESCE(quantidade, 0) + COALESCE(quantidade_vendida, 0)
WHERE quantidade_inicial IS NULL;

-- Backfill snapshots de preço/nome/código
UPDATE public.maletas_pecas mp
SET preco_unitario_snapshot = COALESCE(mp.preco_unitario, p.preco_venda, 0),
    nome_snapshot = p.nome,
    codigo_snapshot = p.codigo
FROM public.pecas p
WHERE mp.peca_id = p.id
  AND (mp.preco_unitario_snapshot IS NULL OR mp.nome_snapshot IS NULL);

ALTER TABLE public.maletas_pecas
  ALTER COLUMN quantidade_inicial SET DEFAULT 0,
  ALTER COLUMN quantidade_inicial SET NOT NULL;

-- ============================================================================
-- 2. Trigger BEFORE INSERT para preencher snapshots automaticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION public.maleta_peca_preencher_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_peca RECORD;
BEGIN
  IF NEW.quantidade_inicial IS NULL OR NEW.quantidade_inicial = 0 THEN
    NEW.quantidade_inicial := COALESCE(NEW.quantidade, 0) + COALESCE(NEW.quantidade_vendida, 0);
  END IF;
  IF NEW.nome_snapshot IS NULL OR NEW.preco_unitario_snapshot IS NULL THEN
    SELECT nome, codigo, preco_venda INTO v_peca FROM public.pecas WHERE id = NEW.peca_id;
    NEW.nome_snapshot := COALESCE(NEW.nome_snapshot, v_peca.nome);
    NEW.codigo_snapshot := COALESCE(NEW.codigo_snapshot, v_peca.codigo);
    NEW.preco_unitario_snapshot := COALESCE(NEW.preco_unitario_snapshot, NEW.preco_unitario, v_peca.preco_venda, 0);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_maleta_peca_snapshot ON public.maletas_pecas;
CREATE TRIGGER trg_maleta_peca_snapshot
  BEFORE INSERT ON public.maletas_pecas
  FOR EACH ROW EXECUTE FUNCTION public.maleta_peca_preencher_snapshot();

-- ============================================================================
-- 3. Tabela maleta_conferencias_itens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maleta_conferencias_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID NOT NULL REFERENCES public.maleta_conferencias(id) ON DELETE CASCADE,
  maleta_peca_id UUID NOT NULL,
  peca_id UUID,
  qtd_esperada INTEGER NOT NULL DEFAULT 0,
  qtd_vendida INTEGER NOT NULL DEFAULT 0,
  qtd_devolvida INTEGER NOT NULL DEFAULT 0,
  qtd_perdida INTEGER NOT NULL DEFAULT 0,
  divergencia BOOLEAN NOT NULL DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maleta_conferencias_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read conferencia itens" ON public.maleta_conferencias_itens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.maleta_conferencias mc
      WHERE mc.id = conferencia_id AND public.user_belongs_to_org(mc.organization_id)
    )
  );

CREATE POLICY "Org members write conferencia itens" ON public.maleta_conferencias_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.maleta_conferencias mc
      WHERE mc.id = conferencia_id AND public.user_belongs_to_org(mc.organization_id)
    )
  );

CREATE INDEX IF NOT EXISTS idx_mci_conferencia ON public.maleta_conferencias_itens(conferencia_id);

-- ============================================================================
-- 4. RPC: maleta_adicionar_peca
-- ============================================================================
CREATE OR REPLACE FUNCTION public.maleta_adicionar_peca(
  p_maleta_id UUID,
  p_peca_id UUID,
  p_quantidade INTEGER,
  p_preco NUMERIC DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID; v_status TEXT; v_estoque INTEGER; v_preco NUMERIC; v_mp_id UUID;
BEGIN
  IF p_quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade deve ser maior que zero'; END IF;
  SELECT organization_id, status INTO v_org, v_status FROM public.maletas WHERE id = p_maleta_id FOR UPDATE;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Maleta não encontrada'; END IF;
  IF NOT public.user_belongs_to_org(v_org) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v_status <> 'ativa' THEN RAISE EXCEPTION 'Maleta não está ativa (status: %)', v_status; END IF;

  SELECT COALESCE(estoque,0), COALESCE(preco_venda,0) INTO v_estoque, v_preco
  FROM public.pecas WHERE id = p_peca_id FOR UPDATE;
  IF v_estoque IS NULL THEN RAISE EXCEPTION 'Peça não encontrada'; END IF;
  IF v_estoque < p_quantidade THEN RAISE EXCEPTION 'Estoque insuficiente (% disponível, % solicitado)', v_estoque, p_quantidade; END IF;

  UPDATE public.pecas SET estoque = estoque - p_quantidade WHERE id = p_peca_id;

  -- Se já existir linha pendente, incrementa; senão insere
  SELECT id INTO v_mp_id FROM public.maletas_pecas
    WHERE maleta_id = p_maleta_id AND peca_id = p_peca_id;

  IF v_mp_id IS NOT NULL THEN
    UPDATE public.maletas_pecas
      SET quantidade = quantidade + p_quantidade,
          quantidade_inicial = quantidade_inicial + p_quantidade,
          updated_at = now()
      WHERE id = v_mp_id;
  ELSE
    INSERT INTO public.maletas_pecas (maleta_id, peca_id, quantidade, quantidade_inicial, preco_unitario)
    VALUES (p_maleta_id, p_peca_id, p_quantidade, p_quantidade, COALESCE(p_preco, v_preco))
    RETURNING id INTO v_mp_id;
  END IF;
  RETURN v_mp_id;
END; $$;

-- ============================================================================
-- 5. RPC: maleta_remover_peca
-- ============================================================================
CREATE OR REPLACE FUNCTION public.maleta_remover_peca(
  p_maleta_peca_id UUID,
  p_quantidade INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org UUID; v_item RECORD;
BEGIN
  SELECT mp.*, m.organization_id AS org_id
    INTO v_item FROM public.maletas_pecas mp
    JOIN public.maletas m ON m.id = mp.maleta_id
    WHERE mp.id = p_maleta_peca_id FOR UPDATE;
  IF v_item IS NULL THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  IF NOT public.user_belongs_to_org(v_item.org_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_quantidade <= 0 OR p_quantidade > v_item.quantidade THEN
    RAISE EXCEPTION 'Quantidade inválida (% disponível pendente)', v_item.quantidade;
  END IF;

  UPDATE public.pecas SET estoque = COALESCE(estoque,0) + p_quantidade WHERE id = v_item.peca_id;

  IF v_item.quantidade = p_quantidade AND COALESCE(v_item.quantidade_vendida,0) = 0
     AND v_item.quantidade_devolvida = 0 AND v_item.quantidade_perdida = 0 THEN
    DELETE FROM public.maletas_pecas WHERE id = p_maleta_peca_id;
  ELSE
    UPDATE public.maletas_pecas
      SET quantidade = quantidade - p_quantidade,
          quantidade_inicial = GREATEST(0, quantidade_inicial - p_quantidade),
          updated_at = now()
      WHERE id = p_maleta_peca_id;
  END IF;
  RETURN true;
END; $$;

-- ============================================================================
-- 6. RPC: maleta_registrar_venda
-- ============================================================================
CREATE OR REPLACE FUNCTION public.maleta_registrar_venda(
  p_maleta_peca_id UUID,
  p_quantidade INTEGER,
  p_preco NUMERIC DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_item RECORD; v_org UUID;
BEGIN
  SELECT mp.*, m.organization_id AS org_id
    INTO v_item FROM public.maletas_pecas mp
    JOIN public.maletas m ON m.id = mp.maleta_id
    WHERE mp.id = p_maleta_peca_id FOR UPDATE;
  IF v_item IS NULL THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  IF NOT public.user_belongs_to_org(v_item.org_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_quantidade <= 0 OR p_quantidade > v_item.quantidade THEN
    RAISE EXCEPTION 'Quantidade inválida (% disponível pendente)', v_item.quantidade;
  END IF;

  UPDATE public.maletas_pecas
    SET quantidade = quantidade - p_quantidade,
        quantidade_vendida = COALESCE(quantidade_vendida,0) + p_quantidade,
        vendida = ((quantidade - p_quantidade) = 0),
        data_venda = CURRENT_DATE,
        preco_unitario = COALESCE(p_preco, preco_unitario),
        updated_at = now()
    WHERE id = p_maleta_peca_id;
  RETURN true;
END; $$;

-- ============================================================================
-- 7. RPC: maleta_desfazer_venda
-- ============================================================================
CREATE OR REPLACE FUNCTION public.maleta_desfazer_venda(
  p_maleta_peca_id UUID,
  p_quantidade INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_item RECORD;
BEGIN
  SELECT mp.*, m.organization_id AS org_id
    INTO v_item FROM public.maletas_pecas mp
    JOIN public.maletas m ON m.id = mp.maleta_id
    WHERE mp.id = p_maleta_peca_id FOR UPDATE;
  IF v_item IS NULL THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  IF NOT public.user_belongs_to_org(v_item.org_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_quantidade <= 0 OR p_quantidade > COALESCE(v_item.quantidade_vendida,0) THEN
    RAISE EXCEPTION 'Quantidade a estornar inválida (% vendido)', COALESCE(v_item.quantidade_vendida,0);
  END IF;

  UPDATE public.maletas_pecas
    SET quantidade = quantidade + p_quantidade,
        quantidade_vendida = COALESCE(quantidade_vendida,0) - p_quantidade,
        vendida = false,
        data_venda = CASE WHEN COALESCE(quantidade_vendida,0) - p_quantidade <= 0 THEN NULL ELSE data_venda END,
        updated_at = now()
    WHERE id = p_maleta_peca_id;
  RETURN true;
END; $$;

-- ============================================================================
-- 8. RPC: maleta_marcar_perdida
-- ============================================================================
CREATE OR REPLACE FUNCTION public.maleta_marcar_perdida(
  p_maleta_peca_id UUID,
  p_quantidade INTEGER,
  p_motivo TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_item RECORD;
BEGIN
  IF p_motivo IS NULL OR length(trim(p_motivo)) < 3 THEN
    RAISE EXCEPTION 'Motivo obrigatório (mínimo 3 caracteres)';
  END IF;
  SELECT mp.*, m.organization_id AS org_id
    INTO v_item FROM public.maletas_pecas mp
    JOIN public.maletas m ON m.id = mp.maleta_id
    WHERE mp.id = p_maleta_peca_id FOR UPDATE;
  IF v_item IS NULL THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  IF NOT public.user_belongs_to_org(v_item.org_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_quantidade <= 0 OR p_quantidade > v_item.quantidade THEN
    RAISE EXCEPTION 'Quantidade inválida (% disponível pendente)', v_item.quantidade;
  END IF;

  UPDATE public.maletas_pecas
    SET quantidade = quantidade - p_quantidade,
        quantidade_perdida = quantidade_perdida + p_quantidade,
        motivo_perda = COALESCE(motivo_perda || ' | ', '') || p_motivo,
        updated_at = now()
    WHERE id = p_maleta_peca_id;
  RETURN true;
END; $$;

-- ============================================================================
-- 9. RPC: maleta_conferir
-- Recebe jsonb [{maleta_peca_id, vendida, devolvida, perdida, observacao}]
-- ============================================================================
CREATE OR REPLACE FUNCTION public.maleta_conferir(
  p_maleta_id UUID,
  p_itens JSONB,
  p_observacoes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID; v_conf_id UUID; v_item JSONB; v_mp RECORD;
  v_total_esp INT := 0; v_total_conf INT := 0; v_diverg INT := 0;
  v_v INT; v_d INT; v_p INT; v_esp INT; v_div BOOLEAN;
  v_divergencias JSONB := '[]'::jsonb;
BEGIN
  SELECT organization_id INTO v_org FROM public.maletas WHERE id = p_maleta_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Maleta não encontrada'; END IF;
  IF NOT public.user_belongs_to_org(v_org) THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  INSERT INTO public.maleta_conferencias (maleta_id, organization_id, user_id, tipo, status, observacoes, itens_conferidos, total_itens, total_conferidos)
  VALUES (p_maleta_id, v_org, auth.uid(), 'fechamento', 'concluida', p_observacoes, p_itens, 0, 0)
  RETURNING id INTO v_conf_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens) LOOP
    SELECT * INTO v_mp FROM public.maletas_pecas WHERE id = (v_item->>'maleta_peca_id')::uuid FOR UPDATE;
    CONTINUE WHEN v_mp IS NULL;

    v_v := COALESCE((v_item->>'vendida')::int, 0);
    v_d := COALESCE((v_item->>'devolvida')::int, 0);
    v_p := COALESCE((v_item->>'perdida')::int, 0);
    v_esp := v_mp.quantidade_inicial;
    v_div := (v_v + v_d + v_p) <> v_esp;
    IF v_div THEN
      v_diverg := v_diverg || jsonb_build_object('maleta_peca_id', v_mp.id, 'nome', v_mp.nome_snapshot, 'esperado', v_esp, 'conferido', v_v + v_d + v_p);
      v_diverg := v_diverg;
    END IF;

    INSERT INTO public.maleta_conferencias_itens (conferencia_id, maleta_peca_id, peca_id, qtd_esperada, qtd_vendida, qtd_devolvida, qtd_perdida, divergencia, observacao)
    VALUES (v_conf_id, v_mp.id, v_mp.peca_id, v_esp, v_v, v_d, v_p, v_div, v_item->>'observacao');

    v_total_esp := v_total_esp + v_esp;
    v_total_conf := v_total_conf + v_v + v_d + v_p;
    IF v_div THEN v_diverg := v_diverg; v_total_conf := v_total_conf; END IF;
  END LOOP;

  v_diverg := COALESCE(v_diverg, '[]'::jsonb);
  UPDATE public.maleta_conferencias
    SET total_itens = v_total_esp, total_conferidos = v_total_conf
    WHERE id = v_conf_id;

  RETURN jsonb_build_object(
    'conferencia_id', v_conf_id,
    'total_esperado', v_total_esp,
    'total_conferido', v_total_conf,
    'divergencias', v_diverg
  );
END; $$;

-- ============================================================================
-- 10. RPC: maleta_fechar_v2
-- ============================================================================
CREATE OR REPLACE FUNCTION public.maleta_fechar_v2(
  p_maleta_id UUID,
  p_forcar BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID; v_status TEXT; v_tem_conf BOOLEAN;
  v_total_devolvido INT := 0; v_total_vendido INT := 0; v_total_perdido INT := 0;
  v_valor_vendido NUMERIC := 0;
  v_item RECORD;
BEGIN
  SELECT organization_id, status INTO v_org, v_status FROM public.maletas WHERE id = p_maleta_id FOR UPDATE;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Maleta não encontrada'; END IF;
  IF NOT public.user_belongs_to_org(v_org) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v_status <> 'ativa' THEN RAISE EXCEPTION 'Maleta já está % ', v_status; END IF;

  IF NOT p_forcar THEN
    SELECT EXISTS(SELECT 1 FROM public.maleta_conferencias WHERE maleta_id = p_maleta_id) INTO v_tem_conf;
    IF NOT v_tem_conf THEN RAISE EXCEPTION 'Realize a conferência antes de fechar (ou use modo forçado)'; END IF;
  END IF;

  -- Para cada item: pendentes voltam ao estoque como devolução
  FOR v_item IN
    SELECT * FROM public.maletas_pecas WHERE maleta_id = p_maleta_id FOR UPDATE
  LOOP
    IF v_item.quantidade > 0 THEN
      UPDATE public.pecas SET estoque = COALESCE(estoque,0) + v_item.quantidade WHERE id = v_item.peca_id;
      INSERT INTO public.maleta_devolucoes (maleta_id, peca_id, quantidade, organization_id, motivo, data_devolucao)
      VALUES (p_maleta_id, v_item.peca_id, v_item.quantidade, v_org, 'Fechamento de maleta', CURRENT_DATE);

      UPDATE public.maletas_pecas
        SET quantidade_devolvida = quantidade_devolvida + v_item.quantidade,
            quantidade = 0,
            data_devolucao = CURRENT_DATE,
            updated_at = now()
        WHERE id = v_item.id;

      v_total_devolvido := v_total_devolvido + v_item.quantidade;
    END IF;
    v_total_vendido := v_total_vendido + COALESCE(v_item.quantidade_vendida,0);
    v_total_perdido := v_total_perdido + COALESCE(v_item.quantidade_perdida,0);
    v_valor_vendido := v_valor_vendido + (COALESCE(v_item.quantidade_vendida,0) * COALESCE(v_item.preco_unitario, v_item.preco_unitario_snapshot, 0));
  END LOOP;

  UPDATE public.maletas SET status = 'fechada', data_devolucao = CURRENT_DATE, updated_at = now() WHERE id = p_maleta_id;

  RETURN jsonb_build_object(
    'devolvidas', v_total_devolvido,
    'vendidas', v_total_vendido,
    'perdidas', v_total_perdido,
    'valor_vendido', v_valor_vendido
  );
END; $$;
