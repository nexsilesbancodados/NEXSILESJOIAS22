
-- ============================================
-- FIX 1: Recriar view pública de catálogos sem dados sensíveis
-- ============================================
DROP VIEW IF EXISTS public.catalogos_public CASCADE;

CREATE VIEW public.catalogos_public 
WITH (security_invoker = on)
AS
SELECT 
  id, nome, descricao, slug,
  imagem_url, imagem_capa, banner_url, logo_url,
  cor_primaria, cor_secundaria,
  mensagem_boas_vindas, titulo,
  ativo, data_validade
FROM public.catalogos
WHERE ativo = true AND slug IS NOT NULL;

-- ============================================
-- FIX 2: Restringir vendas UPDATE a admin/gerente apenas
-- ============================================
DROP POLICY IF EXISTS "vendas_update_policy" ON public.vendas;
DROP POLICY IF EXISTS "Users can update org vendas" ON public.vendas;

CREATE POLICY "vendas_update_admin_gerente"
ON public.vendas
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'gerente')
  )
);
