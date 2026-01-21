-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create password verification function (SECURITY DEFINER to access profiles)
CREATE OR REPLACE FUNCTION public.verify_portal_password(
  p_user_id UUID,
  p_password TEXT
) RETURNS TABLE(is_valid BOOLEAN, user_nome TEXT, user_id UUID)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p.senha_portal IS NOT NULL AND p.senha_portal = crypt(p_password, p.senha_portal)) AS is_valid,
    p.nome AS user_nome,
    p.id AS user_id
  FROM profiles p
  WHERE p.id = p_user_id AND p.role = 'reseller';
END;
$$;

-- Create function to hash password on insert/update
CREATE OR REPLACE FUNCTION public.hash_portal_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create trigger for automatic password hashing on profiles table
DROP TRIGGER IF EXISTS hash_portal_password_trigger ON profiles;
CREATE TRIGGER hash_portal_password_trigger
BEFORE INSERT OR UPDATE OF senha_portal ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.hash_portal_password();

-- Migrate existing plaintext passwords to hashed passwords
-- Only updates passwords that aren't already hashed (not starting with $2)
UPDATE profiles
SET senha_portal = crypt(senha_portal, gen_salt('bf'))
WHERE senha_portal IS NOT NULL 
AND senha_portal != ''
AND role = 'reseller'
AND NOT (senha_portal LIKE '$2%' AND LENGTH(senha_portal) >= 60);