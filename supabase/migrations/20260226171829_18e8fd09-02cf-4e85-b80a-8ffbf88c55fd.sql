
-- RPC to fetch maletas for portal (bypasses RLS safely, scoped to revendedora)
CREATE OR REPLACE FUNCTION public.portal_fetch_maletas(p_revendedora_id uuid)
RETURNS TABLE(
  id uuid,
  nome text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  is_public boolean,
  slug text,
  observacoes text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.nome, m.status, m.created_at, m.updated_at, m.is_public, m.slug, m.observacoes
  FROM public.maletas m
  WHERE m.revendedora_id = p_revendedora_id
  ORDER BY m.created_at DESC;
END;
$$;

-- RPC to fetch maleta pecas for portal
CREATE OR REPLACE FUNCTION public.portal_fetch_maleta_pecas(p_maleta_id uuid, p_revendedora_id uuid)
RETURNS TABLE(
  id uuid,
  quantidade integer,
  quantidade_vendida integer,
  vendida boolean,
  preco_unitario numeric,
  data_venda timestamptz,
  peca_id uuid,
  peca_nome text,
  peca_codigo text,
  peca_preco_venda numeric,
  peca_imagem_url text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the maleta belongs to this revendedora
  IF NOT EXISTS (
    SELECT 1 FROM public.maletas m 
    WHERE m.id = p_maleta_id AND m.revendedora_id = p_revendedora_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT mp.id, mp.quantidade, mp.quantidade_vendida, mp.vendida, mp.preco_unitario, mp.data_venda,
         p.id as peca_id, p.nome as peca_nome, p.codigo as peca_codigo, p.preco_venda as peca_preco_venda, p.imagem_url as peca_imagem_url
  FROM public.maletas_pecas mp
  LEFT JOIN public.pecas p ON mp.peca_id = p.id
  WHERE mp.maleta_id = p_maleta_id;
END;
$$;

-- RPC to fetch interesses for portal
CREATE OR REPLACE FUNCTION public.portal_fetch_interesses(p_revendedora_id uuid)
RETURNS TABLE(
  id uuid,
  maleta_id uuid,
  cliente_nome text,
  cliente_telefone text,
  cliente_email text,
  status text,
  observacoes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT mi.id, mi.maleta_id, mi.cliente_nome, mi.cliente_telefone, mi.cliente_email, mi.status, mi.observacoes, mi.created_at, mi.updated_at
  FROM public.maleta_interesses mi
  INNER JOIN public.maletas m ON mi.maleta_id = m.id
  WHERE m.revendedora_id = p_revendedora_id
  ORDER BY mi.created_at DESC;
END;
$$;
