
-- Add senha column to clientes table
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS senha text;

-- Create trigger to hash password on insert/update (same pattern as revendedoras)
CREATE OR REPLACE FUNCTION public.hash_cliente_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NEW.senha IS NOT NULL 
     AND NEW.senha != '' 
     AND LEFT(NEW.senha, 4) != '$2a$' 
     AND LEFT(NEW.senha, 4) != '$2b$' THEN
    NEW.senha := extensions.crypt(NEW.senha, extensions.gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER hash_cliente_senha_trigger
BEFORE INSERT OR UPDATE OF senha ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.hash_cliente_password();

-- Create verify function for cliente login
CREATE OR REPLACE FUNCTION public.verify_cliente_password(p_email text, p_organization_id uuid)
RETURNS TABLE(cliente_id uuid, cliente_nome text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- This is a lookup function, password check happens in a separate call
  RETURN QUERY
  SELECT c.id, c.nome
  FROM public.clientes c
  WHERE c.email = lower(trim(p_email))
    AND c.organization_id = p_organization_id
    AND c.ativo = true
    AND c.senha IS NOT NULL;
END;
$$;

-- Create full verify function with password
CREATE OR REPLACE FUNCTION public.verify_cliente_login(p_email text, p_password text, p_organization_id uuid)
RETURNS TABLE(cliente_id uuid, cliente_nome text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.nome
  FROM public.clientes c
  WHERE c.email = lower(trim(p_email))
    AND c.organization_id = p_organization_id
    AND c.ativo = true
    AND c.senha IS NOT NULL
    AND c.senha = extensions.crypt(p_password, c.senha);
END;
$$;

-- Create function for customer self-registration
CREATE OR REPLACE FUNCTION public.registrar_cliente_loja(
  p_nome text,
  p_email text,
  p_senha text,
  p_telefone text,
  p_organization_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Check if email already exists for this org
  IF EXISTS (
    SELECT 1 FROM public.clientes 
    WHERE email = lower(trim(p_email)) 
    AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Email já cadastrado';
  END IF;

  INSERT INTO public.clientes (nome, email, telefone, organization_id, senha, ativo)
  VALUES (p_nome, lower(trim(p_email)), p_telefone, p_organization_id, p_senha, true)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Create function to fetch customer orders
CREATE OR REPLACE FUNCTION public.fetch_cliente_pedidos(p_cliente_email text, p_organization_id uuid)
RETURNS TABLE(
  id uuid,
  numero_pedido bigint,
  status text,
  valor_total numeric,
  valor_frete numeric,
  created_at timestamptz,
  metodo_pagamento text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ep.id, ep.numero_pedido::bigint, ep.status, ep.valor_total, ep.valor_frete, ep.created_at, ep.metodo_pagamento
  FROM public.ecommerce_pedidos ep
  WHERE ep.cliente_email = lower(trim(p_cliente_email))
    AND ep.organization_id = p_organization_id
  ORDER BY ep.created_at DESC;
END;
$$;

-- Function to fetch order items
CREATE OR REPLACE FUNCTION public.fetch_cliente_pedido_itens(p_pedido_id uuid)
RETURNS TABLE(
  id uuid,
  quantidade int,
  preco_unitario numeric,
  peca_nome text,
  peca_codigo text,
  peca_imagem_url text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT epi.id, epi.quantidade, epi.preco_unitario, p.nome, p.codigo, p.imagem_url
  FROM public.ecommerce_pedido_itens epi
  LEFT JOIN public.pecas p ON epi.peca_id = p.id
  WHERE epi.pedido_id = p_pedido_id;
END;
$$;
