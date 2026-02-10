
-- Fix: handle_new_user_organization should NOT create org for employees
-- Employees (role=user) are added to existing org by the edge function
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_role TEXT;
BEGIN
  -- Check if user was created as an employee (role = 'user')
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  
  -- Only create organization for admin/owner users (regular signups)
  -- Employees are added to existing org by the criar-funcionario edge function
  IF user_role = 'user' THEN
    RETURN NEW;
  END IF;

  -- Create organization for the new owner user
  INSERT INTO public.organizations (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.id
  )
  RETURNING id INTO new_org_id;
  
  -- Add user as owner of the organization
  INSERT INTO public.memberships (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  -- Add admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;
