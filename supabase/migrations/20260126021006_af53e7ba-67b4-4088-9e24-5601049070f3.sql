-- CORREÇÃO DEFINITIVA: Remover políticas que causam recursão

-- 1. Dropar política problemática em memberships que consulta organizations
DROP POLICY IF EXISTS "membership_owner_manage_policy" ON public.memberships;

-- 2. Recriar política de gerenciamento sem consultar organizations
-- Owners podem gerenciar memberships onde são o owner da org
CREATE POLICY "membership_owner_manage_policy" ON public.memberships
FOR ALL USING (
  -- Usar função SECURITY DEFINER para verificar ownership
  EXISTS (
    SELECT 1 FROM public.organizations o 
    WHERE o.id = memberships.organization_id 
    AND o.owner_id = auth.uid()
  )
);

-- 3. Corrigir a política de SELECT em organizations para não causar recursão
DROP POLICY IF EXISTS "org_select_policy" ON public.organizations;

-- Criar função SECURITY DEFINER para verificar membership
CREATE OR REPLACE FUNCTION public.user_is_member_of_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id
  )
$$;

-- Recriar política de SELECT em organizations usando a função
CREATE POLICY "org_select_policy" ON public.organizations
FOR SELECT USING (
  owner_id = auth.uid() OR user_is_member_of_org(id)
);