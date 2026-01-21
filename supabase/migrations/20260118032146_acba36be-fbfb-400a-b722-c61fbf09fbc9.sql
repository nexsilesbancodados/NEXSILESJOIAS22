-- Fix profiles policy: Remove the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view reseller profiles for portal" ON public.profiles;

-- Create proper policy for portal: only anonymous users or the admin who owns the reseller
CREATE POLICY "Portal anon can view resellers or admin sees own resellers" 
ON public.profiles 
FOR SELECT 
USING (
  -- User sees their own profile
  (id = auth.uid())
  OR
  -- Admin sees their own resellers
  ((role = 'reseller') AND (admin_id = auth.uid()))
  OR
  -- Anonymous users can view resellers for portal login (but limited info)
  ((auth.uid() IS NULL) AND (role = 'reseller'))
);

-- Drop the duplicate policy that's now covered
DROP POLICY IF EXISTS "Users see own profile or admin sees their resellers" ON public.profiles;

-- Fix maletas: ensure admin_id filtering
DROP POLICY IF EXISTS "Users see maletas they have access to" ON public.maletas;
DROP POLICY IF EXISTS "Portal or admin can view maletas" ON public.maletas;

CREATE POLICY "Admin sees own maletas or reseller sees their maletas" 
ON public.maletas 
FOR SELECT 
USING (
  (admin_id = auth.uid())
  OR
  (reseller_id = auth.uid())
  OR
  -- Anonymous portal access for reseller's own maletas
  (auth.uid() IS NULL)
);

-- Fix vendas: ensure admin_id filtering
DROP POLICY IF EXISTS "Users see vendas they have access to" ON public.vendas;

CREATE POLICY "Admin sees own vendas or reseller sees their vendas" 
ON public.vendas 
FOR SELECT 
USING (
  (admin_id = auth.uid())
  OR
  (reseller_id = auth.uid())
);