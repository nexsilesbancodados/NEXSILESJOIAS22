-- Fix 1: Restrict catalog items and catalogs modifications to admins only

-- Drop existing overly permissive policies for catalogo_itens
DROP POLICY IF EXISTS "Authenticated users can create catalogo_itens" ON public.catalogo_itens;
DROP POLICY IF EXISTS "Authenticated users can update catalogo_itens" ON public.catalogo_itens;
DROP POLICY IF EXISTS "Authenticated users can delete catalogo_itens" ON public.catalogo_itens;

-- Create admin-only policies for catalogo_itens modifications
CREATE POLICY "Only admins can create catalogo_itens"
  ON public.catalogo_itens FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update catalogo_itens"
  ON public.catalogo_itens FOR UPDATE
  USING (is_admin());

CREATE POLICY "Only admins can delete catalogo_itens"
  ON public.catalogo_itens FOR DELETE
  USING (is_admin());

-- Drop existing overly permissive policies for catalogos
DROP POLICY IF EXISTS "Authenticated users can create catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "Authenticated users can update catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "Authenticated users can delete catalogos" ON public.catalogos;

-- Create admin-only policies for catalogos modifications
CREATE POLICY "Only admins can create catalogos"
  ON public.catalogos FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update catalogos"
  ON public.catalogos FOR UPDATE
  USING (is_admin());

CREATE POLICY "Only admins can delete catalogos"
  ON public.catalogos FOR DELETE
  USING (is_admin());