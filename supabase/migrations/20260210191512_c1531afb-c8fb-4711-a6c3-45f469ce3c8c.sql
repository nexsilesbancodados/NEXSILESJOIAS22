
-- Fix: handle_new_user should NOT auto-assign admin role 
-- The edge function criar-funcionario handles employee roles explicitly
-- For regular signups (owners), handle_new_user_organization already adds admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );
  
  -- Only give admin role if the user metadata says admin (regular signup)
  -- Employees created via edge function get 'user' role there
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'admin') = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
