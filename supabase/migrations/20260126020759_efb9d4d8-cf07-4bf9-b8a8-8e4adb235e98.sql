-- Primeiro, remover políticas duplicadas/problemáticas na tabela pecas
DROP POLICY IF EXISTS "pecas_delete_policy" ON public.pecas;
DROP POLICY IF EXISTS "pecas_insert_policy" ON public.pecas;
DROP POLICY IF EXISTS "pecas_select_policy" ON public.pecas;
DROP POLICY IF EXISTS "pecas_update_policy" ON public.pecas;

-- Recriar a função get_user_organization_id para não depender de RLS
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT organization_id 
  FROM public.memberships 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- Verificar que as políticas de pecas existentes funcionam corretamente
-- As políticas "Users can ..." já existem e usam get_user_organization_id()