-- Grant SELECT on catalogos_public view to anon and authenticated
GRANT SELECT ON public.catalogos_public TO anon;
GRANT SELECT ON public.catalogos_public TO authenticated;

-- Also ensure anon can read catalogos_pecas for the items query
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'catalogos_pecas' AND policyname = 'anon_select_catalogos_pecas'
  ) THEN
    CREATE POLICY "anon_select_catalogos_pecas" ON public.catalogos_pecas
    FOR SELECT TO anon
    USING (
      EXISTS (
        SELECT 1 FROM public.catalogos c
        WHERE c.id = catalogos_pecas.catalogo_id AND c.ativo = true AND c.slug IS NOT NULL
      )
    );
  END IF;
END $$;