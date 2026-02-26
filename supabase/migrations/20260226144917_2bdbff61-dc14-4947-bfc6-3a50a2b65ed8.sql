
-- Create function that verifies password by revendedora_id (used by edge function)
CREATE OR REPLACE FUNCTION public.verify_portal_password_by_id(p_revendedora_id UUID, p_password TEXT)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.revendedoras r
    WHERE r.id = p_revendedora_id
      AND r.ativo = true
      AND r.senha_portal IS NOT NULL
      AND r.senha_portal = crypt(p_password, r.senha_portal)
  );
END;
$function$;
