
CREATE OR REPLACE FUNCTION public.criar_pedido_catalogo(
  p_catalogo_id uuid,
  p_cliente_nome text,
  p_cliente_telefone text DEFAULT NULL,
  p_cliente_email text DEFAULT NULL,
  p_observacoes text DEFAULT NULL,
  p_valor_total numeric DEFAULT 0,
  p_itens jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id uuid;
  v_catalogo RECORD;
  v_item jsonb;
BEGIN
  -- Verify catalog is active
  SELECT id, organization_id, ativo INTO v_catalogo
  FROM public.catalogos
  WHERE id = p_catalogo_id AND ativo = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Catálogo não encontrado ou inativo';
  END IF;

  -- Create the order
  INSERT INTO public.pedidos_catalogo (catalogo_id, cliente_nome, cliente_telefone, cliente_email, observacoes, valor_total, status)
  VALUES (p_catalogo_id, p_cliente_nome, p_cliente_telefone, p_cliente_email, p_observacoes, p_valor_total, 'pendente')
  RETURNING id INTO v_pedido_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    INSERT INTO public.pedidos_catalogo_itens (pedido_id, peca_id, quantidade, preco_unitario)
    VALUES (
      v_pedido_id,
      (v_item->>'peca_id')::uuid,
      (v_item->>'quantidade')::integer,
      (v_item->>'preco_unitario')::numeric
    );
  END LOOP;

  -- Create romaneio if organization exists
  IF v_catalogo.organization_id IS NOT NULL THEN
    DECLARE
      v_romaneio_id uuid;
    BEGIN
      INSERT INTO public.romaneios (organization_id, observacoes, status)
      VALUES (
        v_catalogo.organization_id,
        'Pedido do catálogo. Cliente: ' || p_cliente_nome || COALESCE('. ' || p_observacoes, ''),
        'pendente'
      )
      RETURNING id INTO v_romaneio_id;

      FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
      LOOP
        INSERT INTO public.romaneios_pecas (romaneio_id, peca_id, quantidade)
        VALUES (
          v_romaneio_id,
          (v_item->>'peca_id')::uuid,
          (v_item->>'quantidade')::integer
        );
      END LOOP;
    EXCEPTION WHEN OTHERS THEN
      -- Don't fail the order if romaneio creation fails
      NULL;
    END;
  END IF;

  RETURN v_pedido_id;
END;
$$;
