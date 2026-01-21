-- Adicionar constraint única para configurações por usuário
ALTER TABLE public.configuracoes 
DROP CONSTRAINT IF EXISTS configuracoes_chave_user_id_unique;

ALTER TABLE public.configuracoes 
ADD CONSTRAINT configuracoes_chave_user_id_unique UNIQUE (chave, user_id);

-- Adicionar admin_id às tabelas de revendedoras e maletas para isolar por admin
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.maletas ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES public.profiles(id);

-- Atualizar dados existentes para associar ao primeiro admin
UPDATE public.profiles 
SET admin_id = (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1) 
WHERE role = 'reseller' AND admin_id IS NULL;

UPDATE public.maletas 
SET admin_id = (
  SELECT p.admin_id FROM public.profiles p 
  WHERE p.id = maletas.reseller_id
) 
WHERE admin_id IS NULL;

UPDATE public.romaneios 
SET admin_id = (
  SELECT p.admin_id FROM public.profiles p 
  WHERE p.id = romaneios.reseller_id
) 
WHERE admin_id IS NULL;

UPDATE public.vendas 
SET admin_id = (
  SELECT p.admin_id FROM public.profiles p 
  WHERE p.id = vendas.reseller_id
) 
WHERE admin_id IS NULL AND reseller_id IS NOT NULL;

-- Atualizar políticas RLS para revendedoras
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile or admins can insert any" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

-- Admins veem suas próprias revendedoras, revendedoras veem apenas seu próprio perfil
CREATE POLICY "Users see own profile or admin sees their resellers"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() 
    OR (role = 'reseller' AND admin_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Admins can insert resellers under them"
  ON public.profiles FOR INSERT
  WITH CHECK (
    id = auth.uid() 
    OR (role = 'reseller' AND admin_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users update own profile or admins update their resellers"
  ON public.profiles FOR UPDATE
  USING (
    id = auth.uid() 
    OR (role = 'reseller' AND admin_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Admins delete their resellers"
  ON public.profiles FOR DELETE
  USING (
    (role = 'reseller' AND admin_id = auth.uid())
    OR is_admin()
  );

-- Atualizar políticas RLS para maletas
DROP POLICY IF EXISTS "Resellers see own maletas, admins see all" ON public.maletas;
DROP POLICY IF EXISTS "Only admins can insert maletas" ON public.maletas;
DROP POLICY IF EXISTS "Only admins can update maletas" ON public.maletas;
DROP POLICY IF EXISTS "Only admins can delete maletas" ON public.maletas;

CREATE POLICY "Users see own maletas or admin sees their maletas"
  ON public.maletas FOR SELECT
  USING (
    reseller_id = auth.uid() 
    OR admin_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY "Admins can insert maletas for their resellers"
  ON public.maletas FOR INSERT
  WITH CHECK (admin_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can update their maletas"
  ON public.maletas FOR UPDATE
  USING (admin_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can delete their maletas"
  ON public.maletas FOR DELETE
  USING (admin_id = auth.uid() OR is_admin());

-- Atualizar políticas RLS para romaneios
DROP POLICY IF EXISTS "Resellers see own romaneios, admins see all" ON public.romaneios;
DROP POLICY IF EXISTS "Authenticated users can insert romaneios" ON public.romaneios;
DROP POLICY IF EXISTS "Only admins can update romaneios" ON public.romaneios;

CREATE POLICY "Users see own romaneios or admin sees their romaneios"
  ON public.romaneios FOR SELECT
  USING (
    reseller_id = auth.uid() 
    OR admin_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY "Authenticated users can insert romaneios"
  ON public.romaneios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update their romaneios"
  ON public.romaneios FOR UPDATE
  USING (admin_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can delete their romaneios"
  ON public.romaneios FOR DELETE
  USING (admin_id = auth.uid() OR is_admin());

-- Atualizar políticas RLS para vendas
DROP POLICY IF EXISTS "Resellers see own vendas, admins see all" ON public.vendas;
DROP POLICY IF EXISTS "Authenticated users can insert vendas" ON public.vendas;
DROP POLICY IF EXISTS "Only admins can update vendas" ON public.vendas;
DROP POLICY IF EXISTS "Only admins can delete vendas" ON public.vendas;

CREATE POLICY "Users see own vendas or admin sees their vendas"
  ON public.vendas FOR SELECT
  USING (
    reseller_id = auth.uid() 
    OR admin_id = auth.uid()
    OR (reseller_id IS NULL AND admin_id IS NULL)
    OR is_admin()
  );

CREATE POLICY "Authenticated users can insert vendas"
  ON public.vendas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update their vendas"
  ON public.vendas FOR UPDATE
  USING (admin_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can delete their vendas"
  ON public.vendas FOR DELETE
  USING (admin_id = auth.uid() OR is_admin());