-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "First user or admins can insert profiles" ON public.profiles;

-- Create new INSERT policy that allows admins to insert profiles
CREATE POLICY "Users can insert own profile or admins can insert any" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  (id = auth.uid()) OR is_admin()
);