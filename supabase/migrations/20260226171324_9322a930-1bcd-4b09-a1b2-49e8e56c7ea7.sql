
-- Create a SECURITY DEFINER function to lookup revendedora by email for portal login
-- This bypasses RLS safely since it only returns limited public data
CREATE OR REPLACE FUNCTION public.portal_login_lookup(p_email text)
RETURNS TABLE(id uuid, nome text, email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.nome, r.email
  FROM public.revendedoras r
  WHERE r.email = lower(trim(p_email))
    AND r.ativo = true
    AND r.senha_portal IS NOT NULL;
END;
$$;
