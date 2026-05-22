CREATE OR REPLACE FUNCTION public.maleta_excluir_definitivo(
  p_maleta_id UUID,
  p_return_to_stock BOOLEAN DEFAULT true
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org UUID;
  v_returned_units INTEGER := 0;
  v_item RECORD;
BEGIN
  SELECT organization_id
    INTO v_org
  FROM public.maletas
  WHERE id = p_maleta_id
  FOR UPDATE;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Maleta não encontrada';
  END IF;

  IF NOT public.user_belongs_to_org(v_org) THEN
    RAISE EXCEPTION 'Sem permissão para excluir esta maleta';
  END IF;

  IF p_return_to_stock THEN
    FOR v_item IN
      SELECT id, peca_id, COALESCE(quantidade, 0) AS quantidade
      FROM public.maletas_pecas
      WHERE maleta_id = p_maleta_id
      FOR UPDATE
    LOOP
      IF v_item.peca_id IS NOT NULL AND v_item.quantidade > 0 THEN
        UPDATE public.pecas
        SET estoque = COALESCE(estoque, 0) + v_item.quantidade,
            updated_at = now()
        WHERE id = v_item.peca_id;

        v_returned_units := v_returned_units + v_item.quantidade;
      END IF;
    END LOOP;
  END IF;

  UPDATE public.envios
  SET maleta_id = NULL,
      updated_at = now()
  WHERE maleta_id = p_maleta_id;

  DELETE FROM public.maleta_interesse_itens
  WHERE interesse_id IN (
    SELECT id FROM public.maleta_interesses WHERE maleta_id = p_maleta_id
  );

  DELETE FROM public.maleta_interesses WHERE maleta_id = p_maleta_id;
  DELETE FROM public.maleta_acertos WHERE maleta_id = p_maleta_id;
  DELETE FROM public.maleta_venda_fotos WHERE maleta_id = p_maleta_id;
  DELETE FROM public.maleta_assinaturas WHERE maleta_id = p_maleta_id;
  DELETE FROM public.maleta_reaberturas WHERE maleta_id = p_maleta_id;
  DELETE FROM public.maleta_transferencias WHERE maleta_origem_id = p_maleta_id OR maleta_destino_id = p_maleta_id;
  DELETE FROM public.maleta_devolucoes WHERE maleta_id = p_maleta_id;
  DELETE FROM public.maleta_conferencias WHERE maleta_id = p_maleta_id;
  DELETE FROM public.maletas_pecas WHERE maleta_id = p_maleta_id;
  DELETE FROM public.maletas WHERE id = p_maleta_id;

  RETURN jsonb_build_object(
    'deleted', true,
    'returned_units', v_returned_units
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.maleta_excluir_definitivo(UUID, BOOLEAN) TO authenticated;