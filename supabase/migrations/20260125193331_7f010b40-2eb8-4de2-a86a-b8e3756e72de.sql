-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Admins can manage metas" ON public.metas;

-- Criar política simples que permite usuários autenticados gerenciarem metas
CREATE POLICY "Authenticated users can manage metas"
ON public.metas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);