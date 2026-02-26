
-- ============================================
-- Enable pgcrypto for bcrypt hashing
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Create trigger to hash portal passwords on INSERT/UPDATE
-- ============================================
CREATE OR REPLACE FUNCTION public.hash_portal_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only hash if senha_portal changed and isn't already a bcrypt hash
  IF NEW.senha_portal IS NOT NULL 
     AND NEW.senha_portal != '' 
     AND LEFT(NEW.senha_portal, 4) != '$2a$' 
     AND LEFT(NEW.senha_portal, 4) != '$2b$' THEN
    NEW.senha_portal := crypt(NEW.senha_portal, gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS hash_portal_password_trigger ON public.revendedoras;
CREATE TRIGGER hash_portal_password_trigger
  BEFORE INSERT OR UPDATE OF senha_portal
  ON public.revendedoras
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_portal_password();

-- ============================================
-- Hash all existing plaintext passwords
-- ============================================
UPDATE public.revendedoras
SET senha_portal = crypt(senha_portal, gen_salt('bf', 10))
WHERE senha_portal IS NOT NULL 
  AND senha_portal != ''
  AND LEFT(senha_portal, 4) != '$2a$'
  AND LEFT(senha_portal, 4) != '$2b$';

-- ============================================
-- Create/replace verify function for portal login
-- ============================================
CREATE OR REPLACE FUNCTION public.verify_portal_password(p_email TEXT, p_password TEXT)
RETURNS TABLE(revendedora_id UUID, revendedora_nome TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.id, r.nome
  FROM public.revendedoras r
  WHERE r.email = p_email
    AND r.ativo = true
    AND r.senha_portal IS NOT NULL
    AND r.senha_portal = crypt(p_password, r.senha_portal);
END;
$function$;
