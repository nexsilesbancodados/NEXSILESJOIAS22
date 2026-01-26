-- Fix overly permissive RLS policies to ensure data isolation

-- ===== MALETAS =====
-- Fix public maleta access - only for anonymous users
DROP POLICY IF EXISTS "maletas_select_public" ON public.maletas;

CREATE POLICY "maletas_select_public_anon" ON public.maletas
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND is_public = true 
  AND sharing_slug IS NOT NULL
);

-- ===== PEDIDOS_CATALOGO =====
-- Remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can view pedidos_catalogo" ON public.pedidos_catalogo;
DROP POLICY IF EXISTS "Admins can manage pedidos_catalogo" ON public.pedidos_catalogo;

-- Create proper policies
CREATE POLICY "pedidos_catalogo_select_org" ON public.pedidos_catalogo
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = pedidos_catalogo.catalogo_id 
    AND catalogos.organization_id = get_user_organization_id()
  )
);

CREATE POLICY "pedidos_catalogo_update_org" ON public.pedidos_catalogo
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = pedidos_catalogo.catalogo_id 
    AND catalogos.organization_id = get_user_organization_id()
  )
);

CREATE POLICY "pedidos_catalogo_delete_org" ON public.pedidos_catalogo
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = pedidos_catalogo.catalogo_id 
    AND catalogos.organization_id = get_user_organization_id()
  )
);

-- ===== PEDIDOS_CATALOGO_ITENS =====
-- Remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can view pedidos_catalogo_itens" ON public.pedidos_catalogo_itens;
DROP POLICY IF EXISTS "Anyone can create pedidos_catalogo_itens" ON public.pedidos_catalogo_itens;

-- Create proper SELECT policy for org members
CREATE POLICY "pedidos_catalogo_itens_select_org" ON public.pedidos_catalogo_itens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pedidos_catalogo pc
    JOIN catalogos c ON c.id = pc.catalogo_id
    WHERE pc.id = pedidos_catalogo_itens.pedido_id
    AND c.organization_id = get_user_organization_id()
  )
);

-- Allow DELETE for org members
CREATE POLICY "pedidos_catalogo_itens_delete_org" ON public.pedidos_catalogo_itens
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pedidos_catalogo pc
    JOIN catalogos c ON c.id = pc.catalogo_id
    WHERE pc.id = pedidos_catalogo_itens.pedido_id
    AND c.organization_id = get_user_organization_id()
  )
);

-- Allow UPDATE for org members
CREATE POLICY "pedidos_catalogo_itens_update_org" ON public.pedidos_catalogo_itens
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pedidos_catalogo pc
    JOIN catalogos c ON c.id = pc.catalogo_id
    WHERE pc.id = pedidos_catalogo_itens.pedido_id
    AND c.organization_id = get_user_organization_id()
  )
);