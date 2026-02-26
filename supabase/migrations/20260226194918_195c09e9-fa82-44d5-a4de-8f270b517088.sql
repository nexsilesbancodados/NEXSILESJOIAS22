
-- Drop and recreate fetch_cliente_pedidos with new columns
DROP FUNCTION IF EXISTS public.fetch_cliente_pedidos(text, uuid);

CREATE OR REPLACE FUNCTION public.fetch_cliente_pedidos(p_cliente_email text, p_organization_id uuid)
RETURNS TABLE(
  id uuid,
  numero_pedido bigint,
  status text,
  valor_total numeric,
  valor_frete numeric,
  valor_desconto numeric,
  created_at timestamptz,
  metodo_pagamento text,
  codigo_rastreio text,
  transportadora text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ep.id, ep.numero_pedido::bigint, ep.status, ep.valor_total, ep.valor_frete, 
         COALESCE(ep.valor_desconto, 0)::numeric, ep.created_at, ep.metodo_pagamento,
         ep.codigo_rastreio, ep.transportadora
  FROM public.ecommerce_pedidos ep
  WHERE ep.cliente_email = lower(trim(p_cliente_email))
    AND ep.organization_id = p_organization_id
  ORDER BY ep.created_at DESC;
END;
$$;
