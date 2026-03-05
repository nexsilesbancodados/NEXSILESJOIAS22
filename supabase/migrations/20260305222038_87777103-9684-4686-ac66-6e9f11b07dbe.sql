-- Drop the blocking anon policy
DROP POLICY IF EXISTS "catalogos_no_anon_access" ON public.catalogos;

-- Create a proper anon SELECT policy that allows reading active catalogs with slug
CREATE POLICY "catalogos_anon_select_active" ON public.catalogos
FOR SELECT TO anon
USING (ativo = true AND slug IS NOT NULL);

-- Also ensure the base table grants SELECT to anon (needed for security_invoker view)
GRANT SELECT ON public.catalogos TO anon;