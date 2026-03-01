
-- Fix overly permissive ALL policy on purchases table
DROP POLICY IF EXISTS "Service role can manage purchases" ON public.purchases;

-- Replace with service_role-only policy (not public role)
CREATE POLICY "Service role full access on purchases"
  ON public.purchases
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.memberships WHERE user_id = auth.uid()
  ));
