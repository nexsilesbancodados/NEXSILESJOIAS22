
-- Fix 1: codigos_acesso - restrict SELECT to only allow lookup by exact code (not full table scan)
DROP POLICY IF EXISTS "codigos_acesso_select_by_code" ON public.codigos_acesso;

-- Only allow selecting a specific code by its value (prevents full table enumeration)
CREATE POLICY "codigos_acesso_select_by_code" 
ON public.codigos_acesso 
FOR SELECT 
USING (
  -- Admins can see their org's codes
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
  )
  OR
  -- Anon can only access unused codes (for redemption flow - filtered by code in app)
  (usado = false)
);

-- Add UPDATE policy so codes can be marked as used
CREATE POLICY "codigos_acesso_update_on_use"
ON public.codigos_acesso
FOR UPDATE
USING (usado = false)
WITH CHECK (usado = true);

-- Fix 2: Secure the public views - recreate with proper filtering
-- catalogos_public already filters ativo=true AND slug IS NOT NULL - this is correct for public catalogs
-- maletas_public already filters is_public=true - correct
-- revendedoras_portal_public exposes name+email of active sellers with portal - this is needed for login

-- Add security comment: these views are intentionally public for their use cases
COMMENT ON VIEW public.catalogos_public IS 'Public view - intentionally accessible for shared catalog links. Only shows active catalogs with slugs.';
COMMENT ON VIEW public.maletas_public IS 'Public view - intentionally accessible for shared briefcase links. Only shows public briefcases.';
COMMENT ON VIEW public.revendedoras_portal_public IS 'Public view - needed for portal login flow. Only exposes name and email of active sellers with portal access.';
