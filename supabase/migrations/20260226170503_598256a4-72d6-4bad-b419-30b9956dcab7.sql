-- Fix hash_portal_password trigger to use extensions schema for pgcrypto functions
CREATE OR REPLACE FUNCTION public.hash_portal_password()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.senha_portal IS NOT NULL 
     AND NEW.senha_portal != '' 
     AND LEFT(NEW.senha_portal, 4) != '$2a$' 
     AND LEFT(NEW.senha_portal, 4) != '$2b$' THEN
    NEW.senha_portal := extensions.crypt(NEW.senha_portal, extensions.gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$function$;

-- Also fix verify functions
CREATE OR REPLACE FUNCTION public.verify_portal_password(p_email text, p_password text)
 RETURNS TABLE(revendedora_id uuid, revendedora_nome text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.id, r.nome
  FROM public.revendedoras r
  WHERE r.email = p_email
    AND r.ativo = true
    AND r.senha_portal IS NOT NULL
    AND r.senha_portal = extensions.crypt(p_password, r.senha_portal);
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_portal_password_by_id(p_revendedora_id uuid, p_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.revendedoras r
    WHERE r.id = p_revendedora_id
      AND r.ativo = true
      AND r.senha_portal IS NOT NULL
      AND r.senha_portal = extensions.crypt(p_password, r.senha_portal)
  );
END;
$function$;
