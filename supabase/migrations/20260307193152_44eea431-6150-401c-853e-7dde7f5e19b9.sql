CREATE OR REPLACE FUNCTION public.criar_interesse_maleta(
  p_maleta_id uuid,
  p_cliente_nome text,
  p_cliente_telefone text DEFAULT NULL,
  p_cliente_email text DEFAULT NULL,
  p_observacoes text DEFAULT NULL,
  p_itens jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_interesse_id uuid;
  v_item jsonb;
BEGIN
  -- Verify maleta is public
  IF NOT EXISTS (SELECT 1 FROM maletas WHERE id = p_maleta_id AND is_public = true) THEN
    RAISE EXCEPTION 'Maleta não disponível';
  END IF;

  -- Create interesse
  INSERT INTO maleta_interesses (maleta_id, cliente_nome, cliente_telefone, cliente_email, observacoes, status)
  VALUES (p_maleta_id, p_cliente_nome, p_cliente_telefone, p_cliente_email, p_observacoes, 'pendente')
  RETURNING id INTO v_interesse_id;

  -- Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    INSERT INTO maleta_interesse_itens (interesse_id, peca_id, quantidade)
    VALUES (
      v_interesse_id,
      (v_item->>'peca_id')::uuid,
      (v_item->>'quantidade')::integer
    );
  END LOOP;

  RETURN v_interesse_id;
END;
$$;