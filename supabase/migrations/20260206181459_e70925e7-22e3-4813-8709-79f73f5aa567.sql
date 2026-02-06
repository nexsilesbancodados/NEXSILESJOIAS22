-- Fix RLS policy to NOT allow NULL organization_id (prevents data leakage)
DROP POLICY IF EXISTS "configuracoes_select_org" ON public.configuracoes;

CREATE POLICY "configuracoes_select_org"
ON public.configuracoes
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- Clean up orphan configurations with NULL organization_id
-- These were causing data leakage to all users
DELETE FROM public.configuracoes WHERE organization_id IS NULL;