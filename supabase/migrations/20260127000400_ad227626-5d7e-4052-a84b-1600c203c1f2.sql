-- ============================================
-- SECURITY FIX: Add organization_id to tables missing it
-- and update RLS policies for complete isolation
-- ============================================

-- 1. Add organization_id to funcionarios table
ALTER TABLE public.funcionarios 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Admins can view funcionarios" ON public.funcionarios;

-- Create new organization-based policies
CREATE POLICY "funcionarios_select_org" ON public.funcionarios
FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "funcionarios_insert_org" ON public.funcionarios
FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "funcionarios_update_org" ON public.funcionarios
FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "funcionarios_delete_org" ON public.funcionarios
FOR DELETE USING (organization_id = get_user_organization_id());

-- 2. Add organization_id to modelos_etiquetas table
ALTER TABLE public.modelos_etiquetas 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Drop old user_id based policies
DROP POLICY IF EXISTS "Users can view own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can view own modelos" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can create own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can insert own modelos" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can insert own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can update own modelos" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can update own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can delete own modelos" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can delete own modelos_etiquetas" ON public.modelos_etiquetas;

-- Create new organization-based policies
CREATE POLICY "modelos_etiquetas_select_org" ON public.modelos_etiquetas
FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "modelos_etiquetas_insert_org" ON public.modelos_etiquetas
FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "modelos_etiquetas_update_org" ON public.modelos_etiquetas
FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "modelos_etiquetas_delete_org" ON public.modelos_etiquetas
FOR DELETE USING (organization_id = get_user_organization_id());

-- 3. Add organization_id to historico_precos via peca relation
-- historico_precos links to pecas which has organization_id
-- Drop old policies
DROP POLICY IF EXISTS "Users can view own historico_precos" ON public.historico_precos;
DROP POLICY IF EXISTS "Users can insert historico_precos" ON public.historico_precos;

-- Create new policies that check organization via peca
CREATE POLICY "historico_precos_select_org" ON public.historico_precos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pecas 
    WHERE pecas.id = historico_precos.peca_id 
    AND pecas.organization_id = get_user_organization_id()
  )
);

CREATE POLICY "historico_precos_insert_org" ON public.historico_precos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pecas 
    WHERE pecas.id = historico_precos.peca_id 
    AND pecas.organization_id = get_user_organization_id()
  )
);

-- 4. Fix configuracoes - remove public SELECT, add organization check
DROP POLICY IF EXISTS "Authenticated can view configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Admins can update configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Admins can delete configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Admins can insert configuracoes" ON public.configuracoes;

-- Add organization_id to configuracoes
ALTER TABLE public.configuracoes 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Create organization-based policies
CREATE POLICY "configuracoes_select_org" ON public.configuracoes
FOR SELECT USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "configuracoes_insert_org" ON public.configuracoes
FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "configuracoes_update_org" ON public.configuracoes
FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "configuracoes_delete_org" ON public.configuracoes
FOR DELETE USING (organization_id = get_user_organization_id());