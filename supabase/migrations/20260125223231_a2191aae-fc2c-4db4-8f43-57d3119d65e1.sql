-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Admins can manage banhos" ON public.banhos;
DROP POLICY IF EXISTS "Authenticated can view banhos" ON public.banhos;

-- Recriar como políticas PERMISSIVAS (padrão)
CREATE POLICY "Authenticated can view banhos" 
ON public.banhos 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can manage banhos" 
ON public.banhos 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));