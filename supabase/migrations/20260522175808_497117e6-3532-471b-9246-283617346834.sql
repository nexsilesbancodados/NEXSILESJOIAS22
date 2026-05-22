
CREATE OR REPLACE FUNCTION public.maleta_adicionar_peca(
  p_maleta_id UUID, p_peca_id UUID, p_quantidade INTEGER, p_preco NUMERIC DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org UUID; v_status TEXT; v_estoque INTEGER; v_preco NUMERIC; v_mp_id UUID;
BEGIN
  IF p_quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade deve ser maior que zero'; END IF;
  SELECT organization_id, status INTO v_org, v_status FROM public.maletas WHERE id = p_maleta_id FOR UPDATE;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Maleta não encontrada'; END IF;
  IF NOT public.user_belongs_to_org(v_org) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v_status NOT IN ('ativa','aberta') THEN RAISE EXCEPTION 'Maleta não está ativa (status: %)', v_status; END IF;

  SELECT COALESCE(estoque,0), COALESCE(preco_venda,0) INTO v_estoque, v_preco
  FROM public.pecas WHERE id = p_peca_id FOR UPDATE;
  IF v_estoque IS NULL THEN RAISE EXCEPTION 'Peça não encontrada'; END IF;
  IF v_estoque < p_quantidade THEN RAISE EXCEPTION 'Estoque insuficiente (% disponível, % solicitado)', v_estoque, p_quantidade; END IF;

  UPDATE public.pecas SET estoque = estoque - p_quantidade WHERE id = p_peca_id;

  SELECT id INTO v_mp_id FROM public.maletas_pecas WHERE maleta_id = p_maleta_id AND peca_id = p_peca_id;
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

CREATE OR REPLACE FUNCTION public.maleta_fechar_v2(
  p_maleta_id UUID, p_forcar BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID; v_status TEXT; v_tem_conf BOOLEAN;
  v_total_devolvido INT := 0; v_total_vendido INT := 0; v_total_perdido INT := 0;
  v_valor_vendido NUMERIC := 0; v_item RECORD;
BEGIN
  SELECT organization_id, status INTO v_org, v_status FROM public.maletas WHERE id = p_maleta_id FOR UPDATE;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Maleta não encontrada'; END IF;
  IF NOT public.user_belongs_to_org(v_org) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v_status NOT IN ('ativa','aberta') THEN RAISE EXCEPTION 'Maleta já está %', v_status; END IF;

  IF NOT p_forcar THEN
    SELECT EXISTS(SELECT 1 FROM public.maleta_conferencias WHERE maleta_id = p_maleta_id) INTO v_tem_conf;
    IF NOT v_tem_conf THEN RAISE EXCEPTION 'Realize a conferência antes de fechar (ou use modo forçado)'; END IF;
  END IF;

  FOR v_item IN SELECT * FROM public.maletas_pecas WHERE maleta_id = p_maleta_id FOR UPDATE LOOP
    IF v_item.quantidade > 0 THEN
      UPDATE public.pecas SET estoque = COALESCE(estoque,0) + v_item.quantidade WHERE id = v_item.peca_id;
      INSERT INTO public.maleta_devolucoes (maleta_id, peca_id, quantidade, organization_id, motivo, data_devolucao)
      VALUES (p_maleta_id, v_item.peca_id, v_item.quantidade, v_org, 'Fechamento de maleta', CURRENT_DATE);
      UPDATE public.maletas_pecas
        SET quantidade_devolvida = quantidade_devolvida + v_item.quantidade,
            quantidade = 0, data_devolucao = CURRENT_DATE, updated_at = now()
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
