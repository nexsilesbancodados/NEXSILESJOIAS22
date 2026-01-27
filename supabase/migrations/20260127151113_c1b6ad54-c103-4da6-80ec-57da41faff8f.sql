-- Primeiro, remover políticas duplicadas/antigas de maletas_pecas que não verificam organization_id
DROP POLICY IF EXISTS "Admins can manage maletas_pecas" ON public.maletas_pecas;

-- Criar novas políticas que verificam organization_id via maleta pai
CREATE POLICY "maletas_pecas_select_org" ON public.maletas_pecas
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.maletas m
    WHERE m.id = maletas_pecas.maleta_id
    AND m.organization_id = get_user_organization_id()
  )
);

CREATE POLICY "maletas_pecas_insert_org" ON public.maletas_pecas
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.maletas m
    WHERE m.id = maletas_pecas.maleta_id
    AND m.organization_id = get_user_organization_id()
  )
);

CREATE POLICY "maletas_pecas_update_org" ON public.maletas_pecas
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.maletas m
    WHERE m.id = maletas_pecas.maleta_id
    AND m.organization_id = get_user_organization_id()
  )
);

CREATE POLICY "maletas_pecas_delete_org" ON public.maletas_pecas
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.maletas m
    WHERE m.id = maletas_pecas.maleta_id
    AND m.organization_id = get_user_organization_id()
  )
);

-- Garantir que maleta_interesse_itens também está protegido para DELETE
CREATE POLICY "interesse_itens_delete_org" ON public.maleta_interesse_itens
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.maleta_interesses mi
    JOIN public.maletas m ON m.id = mi.maleta_id
    WHERE mi.id = maleta_interesse_itens.interesse_id
    AND m.organization_id = get_user_organization_id()
  )
);

-- Policy para UPDATE em maleta_interesse_itens
CREATE POLICY "interesse_itens_update_org" ON public.maleta_interesse_itens
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.maleta_interesses mi
    JOIN public.maletas m ON m.id = mi.maleta_id
    WHERE mi.id = maleta_interesse_itens.interesse_id
    AND m.organization_id = get_user_organization_id()
  )
);