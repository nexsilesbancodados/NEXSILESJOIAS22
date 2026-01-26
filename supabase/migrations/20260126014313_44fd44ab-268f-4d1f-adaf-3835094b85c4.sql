-- FASE 1: Criar função SECURITY DEFINER que retorna organization_ids do usuário
-- Esta função bypassa RLS, evitando recursão infinita
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.memberships 
  WHERE user_id = auth.uid()
$$;

-- FASE 2: Remover política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Users can view memberships of their orgs" ON memberships;

-- FASE 3: Criar nova política SEM recursão usando a função SECURITY DEFINER
-- A função get_user_organization_ids() executa com privilégios do owner (bypassa RLS)
CREATE POLICY "Users can view memberships of their orgs" 
ON public.memberships FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  organization_id IN (SELECT public.get_user_organization_ids())
);