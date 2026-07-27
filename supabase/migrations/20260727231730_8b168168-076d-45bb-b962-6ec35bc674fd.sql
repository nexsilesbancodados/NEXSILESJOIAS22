DROP POLICY IF EXISTS "Root admin can view all errors" ON public.edge_function_errors;

CREATE POLICY "Super admin can view all errors"
ON public.edge_function_errors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.is_super_admin = true
  )
);