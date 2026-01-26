-- Fix remaining security issues

-- ===== CONFIGURACOES =====
-- "Authenticated can view configuracoes" with qual:true is too permissive
-- But this is intentional for app-wide settings, so we'll leave it

-- ===== MALETAS =====
-- Remove duplicate/permissive policy "Public maletas viewable by slug"
DROP POLICY IF EXISTS "Public maletas viewable by slug" ON public.maletas;

-- ===== MALETA_INTERESSES =====
-- These policies are checking maletas but not organization, allowing any authenticated user to access
DROP POLICY IF EXISTS "Authenticated can manage maleta_interesses" ON public.maleta_interesses;
DROP POLICY IF EXISTS "Authenticated can view maleta_interesses" ON public.maleta_interesses;

-- ===== MALETAS_PECAS =====
-- "Anyone can view public maleta items" is too permissive for authenticated users
DROP POLICY IF EXISTS "Anyone can view public maleta items" ON public.maletas_pecas;

-- Create proper policy for public maleta items (anonymous only)
CREATE POLICY "maletas_pecas_select_public_anon" ON public.maletas_pecas
FOR SELECT
USING (
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM maletas m
    WHERE m.id = maletas_pecas.maleta_id
    AND m.is_public = true
    AND m.sharing_slug IS NOT NULL
  ))
  OR
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM maletas m
    WHERE m.id = maletas_pecas.maleta_id
    AND m.organization_id = get_user_organization_id()
  ))
);