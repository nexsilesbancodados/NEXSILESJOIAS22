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
  v_deleted_count INTEGER := 0;
  v_has_remaining BOOLEAN := false;
  v_fk RECORD;
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
    UPDATE public.pecas p
    SET estoque = COALESCE(p.estoque, 0) + x.qtd,
        updated_at = now()
    FROM (
      SELECT peca_id, SUM(COALESCE(quantidade, 0))::integer AS qtd
      FROM public.maletas_pecas
      WHERE maleta_id = p_maleta_id
        AND peca_id IS NOT NULL
        AND COALESCE(quantidade, 0) > 0
      GROUP BY peca_id
    ) x
    WHERE p.id = x.peca_id;

    SELECT COALESCE(SUM(COALESCE(quantidade, 0)), 0)::integer
      INTO v_returned_units
    FROM public.maletas_pecas
    WHERE maleta_id = p_maleta_id
      AND peca_id IS NOT NULL
      AND COALESCE(quantidade, 0) > 0;
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
  DELETE FROM public.maleta_conferencias_itens
  WHERE conferencia_id IN (
    SELECT id FROM public.maleta_conferencias WHERE maleta_id = p_maleta_id
  );
  DELETE FROM public.maleta_conferencias WHERE maleta_id = p_maleta_id;
  DELETE FROM public.maletas_pecas WHERE maleta_id = p_maleta_id;

  DELETE FROM public.maletas WHERE id = p_maleta_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count <> 1 THEN
    RAISE EXCEPTION 'Falha ao excluir maleta';
  END IF;

  FOR v_fk IN
    SELECT rel_t.relname AS table_name, att_t.attname AS column_name
    FROM pg_constraint con
    JOIN pg_class rel_t ON rel_t.oid = con.conrelid
    JOIN pg_namespace n_t ON n_t.oid = rel_t.relnamespace
    JOIN pg_class rel_f ON rel_f.oid = con.confrelid
    JOIN pg_namespace n_f ON n_f.oid = rel_f.relnamespace
    JOIN unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ord) ON true
    JOIN pg_attribute att_t ON att_t.attrelid = con.conrelid AND att_t.attnum = cols.attnum
    WHERE con.contype = 'f'
      AND n_t.nspname = 'public'
      AND n_f.nspname = 'public'
      AND rel_f.relname = 'maletas'
      AND rel_t.relname <> 'envios'
  LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE %I = $1)', v_fk.table_name, v_fk.column_name)
    INTO v_has_remaining
    USING p_maleta_id;

    IF v_has_remaining THEN
      RAISE EXCEPTION 'Exclusão bloqueada por vínculo restante em %.%', v_fk.table_name, v_fk.column_name;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'deleted', true,
    'returned_units', v_returned_units
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.maleta_excluir_definitivo(UUID, BOOLEAN) TO authenticated;