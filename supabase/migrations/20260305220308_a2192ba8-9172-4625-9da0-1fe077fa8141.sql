-- Allow anon users to read pecas that are part of active catalogs
CREATE POLICY "pecas_select_catalogo_publico"
ON public.pecas
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.catalogos_pecas cp
    JOIN public.catalogos c ON c.id = cp.catalogo_id
    WHERE cp.peca_id = pecas.id
      AND c.ativo = true
      AND c.slug IS NOT NULL
  )
);