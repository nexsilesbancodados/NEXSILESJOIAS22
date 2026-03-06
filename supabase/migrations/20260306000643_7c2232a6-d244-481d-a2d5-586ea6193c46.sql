
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
  v_endereco_parts text[];
  v_endereco text;
  v_cidade text;
  v_estado text;
  v_cep text;
BEGIN
  -- Verify catalog is active
  SELECT id, organization_id, ativo, nome INTO v_catalogo
  FROM public.catalogos
  WHERE id = p_catalogo_id AND ativo = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Catálogo não encontrado ou inativo';
  END IF;

  -- Parse address from observacoes if present
  -- Format: "Endereço: Rua X, 123, Bairro, Cidade - SP, CEP: 12345678"
  IF p_observacoes IS NOT NULL AND p_observacoes LIKE 'Endereço:%' THEN
    -- Extract CEP
    IF p_observacoes ~ 'CEP: (\d{8})' THEN
      v_cep := substring(p_observacoes from 'CEP: (\d{8})');
    END IF;
    -- Extract state (2 uppercase letters after " - ")
    IF p_observacoes ~ ' - ([A-Z]{2})' THEN
      v_estado := substring(p_observacoes from ' - ([A-Z]{2})');
    END IF;
    -- Extract city: text before " - UF"
    IF v_estado IS NOT NULL AND p_observacoes ~ ', ([^,]+) - [A-Z]{2}' THEN
      v_cidade := substring(p_observacoes from ', ([^,]+) - [A-Z]{2}');
    END IF;
    -- Full address text (remove the "Endereço: " prefix)
    v_endereco := substring(p_observacoes from 'Endereço: (.+)');
    -- Remove CEP part from address
    IF v_cep IS NOT NULL THEN
      v_endereco := regexp_replace(v_endereco, ',?\s*CEP:\s*\d{8}', '');
    END IF;
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
      INSERT INTO public.romaneios (organization_id, endereco_entrega, cidade, estado, cep, cliente_telefone, observacoes, status)
      VALUES (
        v_catalogo.organization_id,
        v_endereco,
        v_cidade,
        v_estado,
        v_cep,
        p_cliente_telefone,
        'Pedido do catálogo: ' || COALESCE(v_catalogo.nome, '') || '. Cliente: ' || p_cliente_nome || COALESCE('. Email: ' || p_cliente_email, ''),
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
      NULL;
    END;
  END IF;

  RETURN v_pedido_id;
END;
$$;
