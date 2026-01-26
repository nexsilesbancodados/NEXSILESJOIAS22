-- Fix catalogos RLS policies to prevent data leakage between organizations

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view org catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "catalogos_select_public" ON public.catalogos;
DROP POLICY IF EXISTS "catalogos_select_policy" ON public.catalogos;

-- Create proper SELECT policy for authenticated users (only their org)
CREATE POLICY "catalogos_select_org_only" ON public.catalogos
FOR SELECT
USING (organization_id = get_user_organization_id());

-- Create proper SELECT policy for anonymous users (public catalog page only)
CREATE POLICY "catalogos_select_public_anon" ON public.catalogos
FOR SELECT
USING (
  -- Only allow anonymous access to active catalogs with a slug (public links)
  auth.uid() IS NULL 
  AND ativo = true 
  AND slug IS NOT NULL
);

-- Also fix catalogos_pecas to prevent data leakage
DROP POLICY IF EXISTS "Public catalogos_pecas viewable" ON public.catalogos_pecas;

-- Recreate with proper restriction for anonymous only
CREATE POLICY "catalogos_pecas_select_public_anon" ON public.catalogos_pecas
FOR SELECT
USING (
  -- For anonymous users viewing public catalogs
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = catalogos_pecas.catalogo_id 
    AND catalogos.ativo = true 
    AND catalogos.slug IS NOT NULL
  ))
  OR
  -- For authenticated users viewing their org's catalogs
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = catalogos_pecas.catalogo_id 
    AND catalogos.organization_id = get_user_organization_id()
  ))
);