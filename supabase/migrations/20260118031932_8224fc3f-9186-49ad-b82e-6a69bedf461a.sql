-- Drop the problematic policy on pecas
DROP POLICY IF EXISTS "Public can view pecas in public catalogs" ON public.pecas;

-- Create proper policy: authenticated users only see their own pecas
-- Public catalog viewing should only work for anonymous users
CREATE POLICY "Users see own pecas or anon sees public catalog pecas" 
ON public.pecas 
FOR SELECT 
USING (
  -- Authenticated users only see their own pieces
  (auth.uid() = user_id)
  OR
  -- Anonymous users can see pieces in open catalogs
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM catalogo_itens ci
    JOIN catalogos c ON c.id = ci.catalogo_id
    WHERE ci.peca_id = pecas.id AND c.status = 'aberto'
  ))
);

-- Also fix the duplicate "Users see own pecas" policy
DROP POLICY IF EXISTS "Users see own pecas" ON public.pecas;