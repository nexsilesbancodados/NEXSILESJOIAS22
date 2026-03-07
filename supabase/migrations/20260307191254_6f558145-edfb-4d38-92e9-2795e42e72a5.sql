
CREATE OR REPLACE FUNCTION public.portal_desfazer_venda(p_revendedora_id uuid, p_maleta_peca_id uuid, p_quantidade_desfazer integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Get item and verify ownership
  SELECT mp.id, mp.quantidade, mp.quantidade_vendida, mp.maleta_id
  INTO v_item
  FROM public.maletas_pecas mp
  INNER JOIN public.maletas m ON mp.maleta_id = m.id
  WHERE mp.id = p_maleta_peca_id AND m.revendedora_id = p_revendedora_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Cannot undo more than was sold
  IF p_quantidade_desfazer > COALESCE(v_item.quantidade_vendida, 0) THEN
    RAISE EXCEPTION 'Quantidade a desfazer maior que quantidade vendida';
  END IF;

  UPDATE public.maletas_pecas
  SET quantidade = quantidade + p_quantidade_desfazer,
      quantidade_vendida = GREATEST(0, COALESCE(quantidade_vendida, 0) - p_quantidade_desfazer),
      vendida = CASE WHEN (GREATEST(0, COALESCE(quantidade_vendida, 0) - p_quantidade_desfazer)) <= 0 THEN false ELSE vendida END,
      data_venda = CASE WHEN (GREATEST(0, COALESCE(quantidade_vendida, 0) - p_quantidade_desfazer)) <= 0 THEN NULL ELSE data_venda END,
      updated_at = now()
  WHERE id = p_maleta_peca_id;

  RETURN true;
END;
$$;
