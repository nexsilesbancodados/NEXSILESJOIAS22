-- Função Security Definer para verificar role do usuário (evita recursão infinita)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Remover política problemática que causa recursão
DROP POLICY IF EXISTS "Admins can view reseller profiles" ON public.profiles;

-- Recriar política usando a função security definer
CREATE POLICY "Admins can view reseller profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id 
  OR (role = 'revendedora' AND public.get_user_role(auth.uid()) = 'admin')
);