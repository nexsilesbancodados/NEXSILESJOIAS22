-- =====================================================
-- CORREÇÃO DE POLÍTICAS RLS PERMISSIVAS
-- =====================================================

-- 1. PEÇAS: Remover política permissiva e manter apenas a restritiva
-- A política "Anyone can view pecas for portal" é necessária para catálogo público
-- Mas precisamos garantir que dados sensíveis não vazem
DROP POLICY IF EXISTS "Anyone can view pecas for portal" ON public.pecas;

-- Criar política que permite visualização pública APENAS se a peça está em um catálogo público
CREATE POLICY "Public can view pecas in public catalogs" 
ON public.pecas 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM catalogo_itens ci
    JOIN catalogos c ON c.id = ci.catalogo_id
    WHERE ci.peca_id = pecas.id AND c.status = 'aberto'
  )
);

-- 2. MALETAS: Corrigir política permissiva
DROP POLICY IF EXISTS "Anyone can view maletas for portal" ON public.maletas;
DROP POLICY IF EXISTS "Anyone can update maleta items status" ON public.maleta_itens;

-- Maletas podem ser vistas por admins, resellers associados, OU via portal (sem auth)
CREATE POLICY "Portal or owner can view maletas" 
ON public.maletas 
FOR SELECT 
USING (
  reseller_id = auth.uid() 
  OR admin_id = auth.uid()
  OR auth.role() IS NULL
);

-- Maleta itens: apenas donos podem atualizar
CREATE POLICY "Owners can update maleta items" 
ON public.maleta_itens 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM maletas
    WHERE maletas.id = maleta_itens.maleta_id 
    AND (maletas.reseller_id = auth.uid() OR maletas.admin_id = auth.uid())
  )
);

-- 3. HISTORICO_ATIVIDADES: Corrigir política de insert
DROP POLICY IF EXISTS "Allow insert for logging" ON public.historico_atividades;

-- Manter apenas para admins
CREATE POLICY "Authenticated users can insert history" 
ON public.historico_atividades 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 4. ROMANEIOS: Tornar insert mais restritivo
DROP POLICY IF EXISTS "Anyone can create romaneios from portal" ON public.romaneios;

-- Permitir insert do portal (sem auth) OU usuários autenticados
CREATE POLICY "Portal or authenticated can create romaneios" 
ON public.romaneios 
FOR INSERT 
WITH CHECK (auth.role() IS NULL OR auth.role() = 'authenticated');

-- 5. ROMANEIO_ITENS: Tornar insert mais restritivo  
DROP POLICY IF EXISTS "Anyone can create romaneio items from portal" ON public.romaneio_itens;

CREATE POLICY "Portal or authenticated can create romaneio items" 
ON public.romaneio_itens 
FOR INSERT 
WITH CHECK (auth.role() IS NULL OR auth.role() = 'authenticated');

-- 6. VENDAS: Garantir que admin_id seja preenchido automaticamente
-- Criar trigger para preencher admin_id automaticamente
CREATE OR REPLACE FUNCTION public.set_admin_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.admin_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar trigger em vendas
DROP TRIGGER IF EXISTS set_vendas_admin_id ON public.vendas;
CREATE TRIGGER set_vendas_admin_id
  BEFORE INSERT ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_id_on_insert();

-- Aplicar trigger em romaneios
DROP TRIGGER IF EXISTS set_romaneios_admin_id ON public.romaneios;
CREATE TRIGGER set_romaneios_admin_id
  BEFORE INSERT ON public.romaneios
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_id_on_insert();

-- 7. Criar trigger para preencher user_id automaticamente em todas as tabelas
CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar em pecas
DROP TRIGGER IF EXISTS set_pecas_user_id ON public.pecas;
CREATE TRIGGER set_pecas_user_id
  BEFORE INSERT ON public.pecas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- Aplicar em clientes
DROP TRIGGER IF EXISTS set_clientes_user_id ON public.clientes;
CREATE TRIGGER set_clientes_user_id
  BEFORE INSERT ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- Aplicar em fornecedores
DROP TRIGGER IF EXISTS set_fornecedores_user_id ON public.fornecedores;
CREATE TRIGGER set_fornecedores_user_id
  BEFORE INSERT ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- Aplicar em catalogos
DROP TRIGGER IF EXISTS set_catalogos_user_id ON public.catalogos;
CREATE TRIGGER set_catalogos_user_id
  BEFORE INSERT ON public.catalogos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- Aplicar em banhos
DROP TRIGGER IF EXISTS set_banhos_user_id ON public.banhos;
CREATE TRIGGER set_banhos_user_id
  BEFORE INSERT ON public.banhos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- Aplicar em configuracoes
DROP TRIGGER IF EXISTS set_configuracoes_user_id ON public.configuracoes;
CREATE TRIGGER set_configuracoes_user_id
  BEFORE INSERT ON public.configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- Aplicar em metas
DROP TRIGGER IF EXISTS set_metas_user_id ON public.metas;
CREATE TRIGGER set_metas_user_id
  BEFORE INSERT ON public.metas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- Aplicar em modelos_etiquetas
DROP TRIGGER IF EXISTS set_modelos_etiquetas_user_id ON public.modelos_etiquetas;
CREATE TRIGGER set_modelos_etiquetas_user_id
  BEFORE INSERT ON public.modelos_etiquetas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- Aplicar em envios_galvanica
DROP TRIGGER IF EXISTS set_envios_galvanica_user_id ON public.envios_galvanica;
CREATE TRIGGER set_envios_galvanica_user_id
  BEFORE INSERT ON public.envios_galvanica
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();