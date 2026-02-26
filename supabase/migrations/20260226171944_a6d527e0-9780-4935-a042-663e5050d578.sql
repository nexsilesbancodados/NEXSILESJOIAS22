
-- RPC to fetch interesse items for portal
CREATE OR REPLACE FUNCTION public.portal_fetch_interesse_itens(p_interesse_id uuid, p_revendedora_id uuid)
RETURNS TABLE(
  id uuid,
  quantidade integer,
  peca_id uuid,
  peca_nome text,
  peca_codigo text,
  peca_preco_venda numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the interesse belongs to a maleta owned by this revendedora
  IF NOT EXISTS (
    SELECT 1 FROM public.maleta_interesses mi
    INNER JOIN public.maletas m ON mi.maleta_id = m.id
    WHERE mi.id = p_interesse_id AND m.revendedora_id = p_revendedora_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT mii.id, mii.quantidade,
         p.id as peca_id, p.nome as peca_nome, p.codigo as peca_codigo, p.preco_venda as peca_preco_venda
  FROM public.maleta_interesse_itens mii
  LEFT JOIN public.pecas p ON mii.peca_id = p.id
  WHERE mii.interesse_id = p_interesse_id;
END;
$$;

-- RPC for portal to mark items as sold
CREATE OR REPLACE FUNCTION public.portal_marcar_vendida(
  p_revendedora_id uuid,
  p_maleta_peca_id uuid,
  p_quantidade_venda integer
)
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

  UPDATE public.maletas_pecas
  SET quantidade = GREATEST(0, (v_item.quantidade) - p_quantidade_venda),
      quantidade_vendida = COALESCE(v_item.quantidade_vendida, 0) + p_quantidade_venda,
      vendida = (GREATEST(0, (v_item.quantidade) - p_quantidade_venda) <= 0),
      data_venda = CURRENT_DATE,
      updated_at = now()
  WHERE id = p_maleta_peca_id;

  RETURN true;
END;
$$;

-- RPC for portal to update interesse status
CREATE OR REPLACE FUNCTION public.portal_update_interesse_status(
  p_revendedora_id uuid,
  p_interesse_id uuid,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.maleta_interesses mi
    INNER JOIN public.maletas m ON mi.maleta_id = m.id
    WHERE mi.id = p_interesse_id AND m.revendedora_id = p_revendedora_id
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.maleta_interesses
  SET status = p_status, updated_at = now()
  WHERE id = p_interesse_id;

  RETURN true;
END;
$$;
