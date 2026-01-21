-- Secure password hashing for portal access
-- Create function to hash passwords using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash a password
CREATE OR REPLACE FUNCTION public.hash_portal_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

-- Update verify_portal_password to compare hashed passwords
-- This function handles both legacy plain-text and new hashed passwords
CREATE OR REPLACE FUNCTION public.verify_portal_password(p_user_id uuid, p_password text)
RETURNS TABLE(is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_password text;
BEGIN
  SELECT senha_portal INTO stored_password
  FROM profiles
  WHERE user_id = p_user_id;
  
  IF stored_password IS NULL THEN
    RETURN QUERY SELECT false;
    RETURN;
  END IF;
  
  -- Check if password is hashed (bcrypt hashes start with $2)
  IF stored_password LIKE '$2%' THEN
    -- Compare with hashed password
    RETURN QUERY SELECT stored_password = crypt(p_password, stored_password);
  ELSE
    -- Legacy plain-text comparison (for migration period)
    -- After verification, we should migrate to hash
    IF stored_password = p_password THEN
      -- Auto-migrate to hashed password
      UPDATE profiles 
      SET senha_portal = crypt(p_password, gen_salt('bf', 12))
      WHERE user_id = p_user_id;
      
      RETURN QUERY SELECT true;
    ELSE
      RETURN QUERY SELECT false;
    END IF;
  END IF;
END;
$$;

-- Add trigger to automatically hash new passwords
CREATE OR REPLACE FUNCTION public.hash_senha_portal_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only hash if senha_portal is being set/changed and is not already hashed
  IF NEW.senha_portal IS NOT NULL AND NEW.senha_portal != '' THEN
    IF NEW.senha_portal NOT LIKE '$2%' THEN
      NEW.senha_portal := crypt(NEW.senha_portal, gen_salt('bf', 12));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS hash_senha_portal_on_insert_update ON profiles;
CREATE TRIGGER hash_senha_portal_on_insert_update
  BEFORE INSERT OR UPDATE OF senha_portal ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_senha_portal_trigger();

-- Fix RLS for historico_atividades: ensure INSERT checks user_id
DROP POLICY IF EXISTS "Users can insert their own historico" ON historico_atividades;
CREATE POLICY "Users can insert their own historico"
  ON historico_atividades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for historico_atividades (missing)
DROP POLICY IF EXISTS "Users can delete their own historico" ON historico_atividades;
CREATE POLICY "Users can delete their own historico"
  ON historico_atividades
  FOR DELETE
  USING (auth.uid() = user_id);