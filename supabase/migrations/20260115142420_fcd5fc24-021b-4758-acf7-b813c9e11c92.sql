-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the trigger function to ensure it works
CREATE OR REPLACE FUNCTION public.hash_portal_password()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Only hash if senha_portal is being set and isn't already a bcrypt hash
  IF NEW.senha_portal IS NOT NULL AND NEW.senha_portal != '' THEN
    -- Check if it's already a bcrypt hash (starts with $2)
    IF NOT (NEW.senha_portal LIKE '$2%' AND LENGTH(NEW.senha_portal) >= 60) THEN
      NEW.senha_portal := crypt(NEW.senha_portal, gen_salt('bf'));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS hash_portal_password_trigger ON public.profiles;
CREATE TRIGGER hash_portal_password_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_portal_password();

-- Also fix verify_portal_password function
CREATE OR REPLACE FUNCTION public.verify_portal_password(p_user_id uuid, p_password text)
 RETURNS TABLE(is_valid boolean, user_nome text, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (p.senha_portal IS NOT NULL AND p.senha_portal = crypt(p_password, p.senha_portal)) AS is_valid,
    p.nome AS user_nome,
    p.id AS user_id
  FROM profiles p
  WHERE p.id = p_user_id AND p.role = 'reseller';
END;
$function$;