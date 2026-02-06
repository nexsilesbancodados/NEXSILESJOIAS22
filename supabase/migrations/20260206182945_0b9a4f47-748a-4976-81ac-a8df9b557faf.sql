-- =============================================
-- SECURITY HARDENING MIGRATION
-- Fix exposed sensitive data and restrict access
-- =============================================

-- 1. Fix revendedoras public access - CRITICAL: removes password exposure
DROP POLICY IF EXISTS "revendedoras_select_portal_login" ON public.revendedoras;

-- Create a view for portal login that only exposes necessary fields (no passwords)
CREATE OR REPLACE VIEW public.revendedoras_portal_public
WITH (security_invoker=on) AS
  SELECT id, nome, usuario_portal
  FROM public.revendedoras
  WHERE usuario_portal IS NOT NULL AND ativo = true;

-- Grant access to the view for anon users (for login page only)
GRANT SELECT ON public.revendedoras_portal_public TO anon;
GRANT SELECT ON public.revendedoras_portal_public TO authenticated;

-- 2. Create secure view for catalogos public access
DROP POLICY IF EXISTS "catalogos_select_public_anon" ON public.catalogos;

CREATE OR REPLACE VIEW public.catalogos_public
WITH (security_invoker=on) AS
  SELECT 
    id, nome, descricao, slug, imagem_url, imagem_capa, banner_url, logo_url,
    cor_primaria, cor_secundaria, mensagem_boas_vindas, titulo, ativo, 
    data_validade, pedido_minimo_pecas
  FROM public.catalogos
  WHERE ativo = true AND slug IS NOT NULL;

GRANT SELECT ON public.catalogos_public TO anon;
GRANT SELECT ON public.catalogos_public TO authenticated;

-- Deny direct anon access to catalogos base table
CREATE POLICY "catalogos_no_anon_access"
ON public.catalogos
FOR SELECT
TO anon
USING (false);

-- 3. Create secure view for maletas public access  
DROP POLICY IF EXISTS "maletas_select_public_anon" ON public.maletas;

CREATE OR REPLACE VIEW public.maletas_public
WITH (security_invoker=on) AS
  SELECT 
    id, nome, descricao, sharing_slug, imagem_capa, 
    cor_primaria, cor_secundaria, status, is_public
  FROM public.maletas
  WHERE is_public = true;

GRANT SELECT ON public.maletas_public TO anon;
GRANT SELECT ON public.maletas_public TO authenticated;

-- Deny direct anon access to maletas base table
CREATE POLICY "maletas_no_anon_access"
ON public.maletas
FOR SELECT
TO anon
USING (false);

-- 4. Fix funcionarios - restrict salary access to admin/gerente only
DROP POLICY IF EXISTS "funcionarios_select_policy" ON public.funcionarios;

-- Only admin/gerente can see all employee data including salary
CREATE POLICY "funcionarios_select_admin"
ON public.funcionarios
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'gerente')
    OR user_id = auth.uid() -- Employees can see their own record
  )
);

-- 5. Restrict historico_atividades - only triggers can insert
DROP POLICY IF EXISTS "historico_insert_policy" ON public.historico_atividades;
DROP POLICY IF EXISTS "historico_atividades_insert_org" ON public.historico_atividades;

-- Make audit log immutable - only triggers insert, no one updates/deletes
CREATE POLICY "historico_select_admin_only"
ON public.historico_atividades
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'gerente')
  )
);

-- 6. Restrict vendas access based on role
DROP POLICY IF EXISTS "vendas_select_org" ON public.vendas;
DROP POLICY IF EXISTS "vendas_select_policy" ON public.vendas;

CREATE POLICY "vendas_select_role_based"
ON public.vendas
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'gerente')
    OR vendedor_id = auth.uid()
  )
);

-- 7. Make movimentos_caixa immutable (no updates after creation)
DROP POLICY IF EXISTS "movimentos_caixa_update_admin" ON public.movimentos_caixa;
DROP POLICY IF EXISTS "movimentos_caixa_delete_admin" ON public.movimentos_caixa;

-- 8. Restrict pecas - hide preco_custo from non-admin
-- This is done via application layer since we can't do field-level RLS
-- But we ensure only org members can access
DROP POLICY IF EXISTS "pecas_select_policy" ON public.pecas;

CREATE POLICY "pecas_select_org_only"
ON public.pecas
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- 9. Ensure clientes is properly isolated
DROP POLICY IF EXISTS "clientes_select_policy" ON public.clientes;

CREATE POLICY "clientes_select_org"
ON public.clientes
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- 10. Enable leaked password protection in auth settings
-- Note: This must be done via Supabase Dashboard > Authentication > Settings