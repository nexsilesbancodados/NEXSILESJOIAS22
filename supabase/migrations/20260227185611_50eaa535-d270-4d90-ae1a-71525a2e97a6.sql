
-- Remove the policy that blocks all anonymous access
DROP POLICY IF EXISTS "maletas_no_anon_access" ON public.maletas;

-- Remove the old portal policy that's too restrictive
DROP POLICY IF EXISTS "maletas_select_portal" ON public.maletas;

-- Create a proper policy for anonymous users to view public maletas
CREATE POLICY "anon_can_view_public_maletas"
  ON public.maletas
  FOR SELECT
  TO anon
  USING (is_public = true);
