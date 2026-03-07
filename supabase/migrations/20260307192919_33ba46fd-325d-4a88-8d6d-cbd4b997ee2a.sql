-- Allow authenticated users to SELECT maleta_interesses for public maletas
-- This is needed so the INSERT policy on maleta_interesse_itens can verify the interesse exists
CREATE POLICY "maleta_interesses_select_public"
ON public.maleta_interesses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.maletas m
    WHERE m.id = maleta_interesses.maleta_id
    AND m.is_public = true
  )
);

-- Allow authenticated users to SELECT maleta_interesse_itens for public maletas  
CREATE POLICY "maleta_interesse_itens_select_public"
ON public.maleta_interesse_itens
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.maleta_interesses mi
    JOIN public.maletas m ON m.id = mi.maleta_id
    WHERE mi.id = maleta_interesse_itens.interesse_id
    AND m.is_public = true
  )
);