
DROP FUNCTION IF EXISTS public.portal_login_lookup(text);

CREATE OR REPLACE FUNCTION public.portal_login_lookup(p_email text)
RETURNS TABLE(id uuid, nome text, email text, comissao_percentual numeric, telefone text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.nome, r.email, r.comissao_percentual, r.telefone
  FROM public.revendedoras r
  WHERE r.email = lower(trim(p_email))
    AND r.ativo = true
    AND r.senha_portal IS NOT NULL;
END;
$$;
