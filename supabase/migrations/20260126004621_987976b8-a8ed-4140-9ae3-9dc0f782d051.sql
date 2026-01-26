-- =====================================================
-- MULTI-TENANCY: Isolamento de dados por organização
-- =====================================================

-- 1. Criar tabela de organizações
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criar tabela de memberships (usuários pertencentes a organizações)
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- 3. Adicionar organization_id às tabelas principais
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.revendedoras ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.maletas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.banhos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.caixa_sessoes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 4. Habilitar RLS nas novas tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 5. Função para obter organization_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.memberships 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- 6. Função para verificar se usuário pertence a uma organização
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() AND organization_id = _org_id
  )
$$;

-- 7. Políticas para organizations
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (public.user_belongs_to_org(id));

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their organizations"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- 8. Políticas para memberships
CREATE POLICY "Users can view memberships of their orgs"
  ON public.memberships FOR SELECT
  USING (user_id = auth.uid() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Owners can manage memberships"
  ON public.memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = organization_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own membership"
  ON public.memberships FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 9. Remover políticas antigas permissivas e criar novas baseadas em organization_id

-- VENDAS
DROP POLICY IF EXISTS "Authenticated can view vendas" ON public.vendas;
DROP POLICY IF EXISTS "Authenticated can create vendas" ON public.vendas;
DROP POLICY IF EXISTS "Admins can manage vendas" ON public.vendas;

CREATE POLICY "Users can view org vendas"
  ON public.vendas FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can create org vendas"
  ON public.vendas FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can manage org vendas"
  ON public.vendas FOR ALL
  USING (
    organization_id = public.get_user_organization_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

-- PECAS
DROP POLICY IF EXISTS "Authenticated can view pecas" ON public.pecas;
DROP POLICY IF EXISTS "Anyone can view active pecas" ON public.pecas;
DROP POLICY IF EXISTS "Admins can manage pecas" ON public.pecas;

CREATE POLICY "Users can view org pecas"
  ON public.pecas FOR SELECT
  USING (organization_id = public.get_user_organization_id() OR (ativo = true AND organization_id IS NULL));

CREATE POLICY "Admins can manage org pecas"
  ON public.pecas FOR ALL
  USING (
    organization_id = public.get_user_organization_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

-- CLIENTES
DROP POLICY IF EXISTS "Authenticated can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated can manage clientes" ON public.clientes;

CREATE POLICY "Users can view org clientes"
  ON public.clientes FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can manage org clientes"
  ON public.clientes FOR ALL
  USING (organization_id = public.get_user_organization_id());

-- REVENDEDORAS
DROP POLICY IF EXISTS "Authenticated can view revendedoras" ON public.revendedoras;
DROP POLICY IF EXISTS "Admins can manage revendedoras" ON public.revendedoras;
DROP POLICY IF EXISTS "Revendedora can view own" ON public.revendedoras;

CREATE POLICY "Users can view org revendedoras"
  ON public.revendedoras FOR SELECT
  USING (organization_id = public.get_user_organization_id() OR user_id = auth.uid());

CREATE POLICY "Admins can manage org revendedoras"
  ON public.revendedoras FOR ALL
  USING (
    organization_id = public.get_user_organization_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

-- FORNECEDORES
DROP POLICY IF EXISTS "Authenticated can view fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Admins can manage fornecedores" ON public.fornecedores;

CREATE POLICY "Users can view org fornecedores"
  ON public.fornecedores FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can manage org fornecedores"
  ON public.fornecedores FOR ALL
  USING (
    organization_id = public.get_user_organization_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

-- MALETAS
DROP POLICY IF EXISTS "Authenticated can view maletas" ON public.maletas;
DROP POLICY IF EXISTS "Anyone can view public maletas" ON public.maletas;
DROP POLICY IF EXISTS "Admins can manage maletas" ON public.maletas;

CREATE POLICY "Users can view org maletas"
  ON public.maletas FOR SELECT
  USING (organization_id = public.get_user_organization_id() OR is_public = true);

CREATE POLICY "Admins can manage org maletas"
  ON public.maletas FOR ALL
  USING (
    organization_id = public.get_user_organization_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

-- CATALOGOS
DROP POLICY IF EXISTS "Authenticated can view all catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "Anyone can view active catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "Admins can manage catalogos" ON public.catalogos;

CREATE POLICY "Users can view org catalogos"
  ON public.catalogos FOR SELECT
  USING (organization_id = public.get_user_organization_id() OR ativo = true);

CREATE POLICY "Admins can manage org catalogos"
  ON public.catalogos FOR ALL
  USING (
    organization_id = public.get_user_organization_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

-- CAMPANHAS
DROP POLICY IF EXISTS "Authenticated can view campanhas" ON public.campanhas;
DROP POLICY IF EXISTS "Admins can manage campanhas" ON public.campanhas;

CREATE POLICY "Users can view org campanhas"
  ON public.campanhas FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can manage org campanhas"
  ON public.campanhas FOR ALL
  USING (
    organization_id = public.get_user_organization_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

-- ROMANEIOS
DROP POLICY IF EXISTS "Authenticated can view romaneios" ON public.romaneios;
DROP POLICY IF EXISTS "Admins can manage romaneios" ON public.romaneios;

CREATE POLICY "Users can view org romaneios"
  ON public.romaneios FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can manage org romaneios"
  ON public.romaneios FOR ALL
  USING (
    organization_id = public.get_user_organization_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

-- BANHOS
DROP POLICY IF EXISTS "Authenticated can view banhos" ON public.banhos;
DROP POLICY IF EXISTS "Admins can manage banhos" ON public.banhos;

CREATE POLICY "Users can view org banhos"
  ON public.banhos FOR SELECT
  USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Admins can manage org banhos"
  ON public.banhos FOR ALL
  USING (
    organization_id = public.get_user_organization_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
  );

-- METAS
DROP POLICY IF EXISTS "Authenticated can view metas" ON public.metas;
DROP POLICY IF EXISTS "Authenticated users can manage metas" ON public.metas;

CREATE POLICY "Users can view org metas"
  ON public.metas FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can manage org metas"
  ON public.metas FOR ALL
  USING (organization_id = public.get_user_organization_id());

-- CAIXA_SESSOES
DROP POLICY IF EXISTS "Authenticated can view caixa_sessoes" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "Authenticated can create caixa_sessoes" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "Authenticated can update caixa_sessoes" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "Authenticated can delete caixa_sessoes" ON public.caixa_sessoes;

CREATE POLICY "Users can view org caixa_sessoes"
  ON public.caixa_sessoes FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can manage org caixa_sessoes"
  ON public.caixa_sessoes FOR ALL
  USING (organization_id = public.get_user_organization_id());

-- 10. Trigger para criar organização automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Criar organização para o novo usuário
  INSERT INTO public.organizations (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.id
  )
  RETURNING id INTO new_org_id;
  
  -- Adicionar usuário como owner da organização
  INSERT INTO public.memberships (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  -- Adicionar role admin ao user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir e criar novo
DROP TRIGGER IF EXISTS on_auth_user_created_organization ON auth.users;
CREATE TRIGGER on_auth_user_created_organization
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_organization();

-- 11. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON public.memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_pecas_org_id ON public.pecas(organization_id);
CREATE INDEX IF NOT EXISTS idx_clientes_org_id ON public.clientes(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendas_org_id ON public.vendas(organization_id);
CREATE INDEX IF NOT EXISTS idx_revendedoras_org_id ON public.revendedoras(organization_id);
CREATE INDEX IF NOT EXISTS idx_maletas_org_id ON public.maletas(organization_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_org_id ON public.fornecedores(organization_id);