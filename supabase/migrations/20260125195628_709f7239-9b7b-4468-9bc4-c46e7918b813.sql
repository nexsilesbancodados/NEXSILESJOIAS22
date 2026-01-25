-- Atualizar função para dar role admin a TODOS os novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Criar perfil do usuário
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );
  
  -- Dar role de admin para TODOS os novos usuários
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Atualizar políticas do caixa para permitir acesso de vendedores
DROP POLICY IF EXISTS "Authenticated can view caixa_sessoes" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "Authenticated can create caixa_sessoes" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "Authenticated can update caixa_sessoes" ON public.caixa_sessoes;

CREATE POLICY "Authenticated can view caixa_sessoes" 
ON public.caixa_sessoes 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated can create caixa_sessoes" 
ON public.caixa_sessoes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update caixa_sessoes" 
ON public.caixa_sessoes 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete caixa_sessoes" 
ON public.caixa_sessoes 
FOR DELETE 
TO authenticated
USING (true);

-- Atualizar políticas de movimentos_caixa
DROP POLICY IF EXISTS "Authenticated can view movimentos_caixa" ON public.movimentos_caixa;
DROP POLICY IF EXISTS "Authenticated can create movimentos_caixa" ON public.movimentos_caixa;

CREATE POLICY "Authenticated can view movimentos_caixa" 
ON public.movimentos_caixa 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated can create movimentos_caixa" 
ON public.movimentos_caixa 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update movimentos_caixa" 
ON public.movimentos_caixa 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete movimentos_caixa" 
ON public.movimentos_caixa 
FOR DELETE 
TO authenticated
USING (true);