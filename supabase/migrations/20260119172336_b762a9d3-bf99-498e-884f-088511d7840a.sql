-- Atualizar função handle_new_user para definir primeiro usuário como admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER;
  user_role TEXT;
BEGIN
  -- Contar quantos profiles já existem
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Se for o primeiro usuário, é admin; senão, é user
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  END IF;
  
  INSERT INTO public.profiles (user_id, email, nome, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    user_role
  );
  RETURN NEW;
END;
$$;

-- Criar tabela de permissões para controle granular
CREATE TABLE IF NOT EXISTS public.permissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  pode_ver BOOLEAN DEFAULT false,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, modulo)
);

-- Enable RLS
ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;

-- Policies para permissoes
CREATE POLICY "Admins can view all permissoes"
ON public.permissoes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert permissoes"
ON public.permissoes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update permissoes"
ON public.permissoes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete permissoes"
ON public.permissoes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Users can view their own permissoes
CREATE POLICY "Users can view own permissoes"
ON public.permissoes FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Atualizar o usuário existente para admin
UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1);