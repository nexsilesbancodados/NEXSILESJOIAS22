-- ============ CAMPANHAS ============
DROP POLICY IF EXISTS "Admins can manage campanhas" ON public.campanhas;
DROP POLICY IF EXISTS "Authenticated can view campanhas" ON public.campanhas;

CREATE POLICY "Authenticated can view campanhas" 
ON public.campanhas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage campanhas" 
ON public.campanhas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- ============ CATALOGOS ============
DROP POLICY IF EXISTS "Admins can manage catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "Anyone can view active catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "Authenticated can view all catalogos" ON public.catalogos;

CREATE POLICY "Anyone can view active catalogos" 
ON public.catalogos FOR SELECT USING (ativo = true);

CREATE POLICY "Authenticated can view all catalogos" 
ON public.catalogos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage catalogos" 
ON public.catalogos FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- ============ CATALOGOS_PECAS ============
DROP POLICY IF EXISTS "Admins can manage catalogos_pecas" ON public.catalogos_pecas;
DROP POLICY IF EXISTS "Anyone can view catalogos_pecas" ON public.catalogos_pecas;

CREATE POLICY "Anyone can view catalogos_pecas" 
ON public.catalogos_pecas FOR SELECT USING (true);

CREATE POLICY "Admins can manage catalogos_pecas" 
ON public.catalogos_pecas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- ============ FORNECEDORES ============
DROP POLICY IF EXISTS "Admins can manage fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated can view fornecedores" ON public.fornecedores;

CREATE POLICY "Authenticated can view fornecedores" 
ON public.fornecedores FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage fornecedores" 
ON public.fornecedores FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- ============ MALETAS ============
DROP POLICY IF EXISTS "Admins can manage maletas" ON public.maletas;
DROP POLICY IF EXISTS "Authenticated can view maletas" ON public.maletas;

CREATE POLICY "Authenticated can view maletas" 
ON public.maletas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage maletas" 
ON public.maletas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- ============ MALETAS_PECAS ============
DROP POLICY IF EXISTS "Admins can manage maletas_pecas" ON public.maletas_pecas;
DROP POLICY IF EXISTS "Authenticated can view maletas_pecas" ON public.maletas_pecas;

CREATE POLICY "Authenticated can view maletas_pecas" 
ON public.maletas_pecas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage maletas_pecas" 
ON public.maletas_pecas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- ============ PECAS ============
DROP POLICY IF EXISTS "Admins can manage pecas" ON public.pecas;
DROP POLICY IF EXISTS "Authenticated can view pecas" ON public.pecas;

CREATE POLICY "Authenticated can view pecas" 
ON public.pecas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view active pecas" 
ON public.pecas FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage pecas" 
ON public.pecas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- ============ ROMANEIOS ============
DROP POLICY IF EXISTS "Admins can manage romaneios" ON public.romaneios;
DROP POLICY IF EXISTS "Authenticated can view romaneios" ON public.romaneios;

CREATE POLICY "Authenticated can view romaneios" 
ON public.romaneios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage romaneios" 
ON public.romaneios FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- ============ ROMANEIOS_PECAS ============
DROP POLICY IF EXISTS "Admins can manage romaneios_pecas" ON public.romaneios_pecas;
DROP POLICY IF EXISTS "Authenticated can view romaneios_pecas" ON public.romaneios_pecas;

CREATE POLICY "Authenticated can view romaneios_pecas" 
ON public.romaneios_pecas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage romaneios_pecas" 
ON public.romaneios_pecas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- ============ REVENDEDORAS ============
DROP POLICY IF EXISTS "Admins can manage revendedoras" ON public.revendedoras;
DROP POLICY IF EXISTS "Authenticated can view revendedoras" ON public.revendedoras;
DROP POLICY IF EXISTS "Revendedora can view own" ON public.revendedoras;

CREATE POLICY "Authenticated can view revendedoras" 
ON public.revendedoras FOR SELECT TO authenticated USING (true);

CREATE POLICY "Revendedora can view own" 
ON public.revendedoras FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage revendedoras" 
ON public.revendedoras FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));