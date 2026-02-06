-- Fix conflicting policy
DROP POLICY IF EXISTS "fornecedores_select_admin" ON public.fornecedores;

CREATE POLICY "fornecedores_select_admin"
ON public.fornecedores
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'gerente')
  )
);