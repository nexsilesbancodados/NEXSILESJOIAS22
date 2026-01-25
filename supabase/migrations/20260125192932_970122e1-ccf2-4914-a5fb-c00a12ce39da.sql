-- Remover política existente que exige role admin
DROP POLICY IF EXISTS "Admins can manage configuracoes" ON public.configuracoes;

-- Criar política que permite todos usuários autenticados gerenciarem configurações
CREATE POLICY "Authenticated users can manage configuracoes"
ON public.configuracoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);