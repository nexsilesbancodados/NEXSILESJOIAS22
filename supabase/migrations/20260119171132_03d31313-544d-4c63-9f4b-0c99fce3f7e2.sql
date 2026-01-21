-- 1. Adicionar colunas faltantes em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS comissao numeric DEFAULT 30,
ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS senha_portal text;

-- 2. Criar trigger para auto-criar profile no signup (se não existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Criar função verify_portal_password para autenticação do portal da revendedora
CREATE OR REPLACE FUNCTION public.verify_portal_password(p_user_id uuid, p_password text)
RETURNS TABLE(is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
    AND senha_portal = p_password
  ) AS is_valid;
END;
$$;

-- 4. Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION public.verify_portal_password(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_portal_password(uuid, text) TO authenticated;

-- 5. Adicionar policy para admins verem profiles de revendedoras
CREATE POLICY "Admins can view reseller profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (role = 'revendedora' AND EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin'
  ))
);

-- 6. Criar storage buckets se não existirem
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pecas', 'pecas', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('catalogos', 'catalogos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Policies para storage (pecas)
CREATE POLICY "Anyone can view peca images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pecas');

CREATE POLICY "Authenticated users can upload peca images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'pecas' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own peca images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'pecas' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own peca images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'pecas' AND auth.role() = 'authenticated');

-- 8. Policies para storage (avatars)
CREATE POLICY "Anyone can view avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 9. Policies para storage (catalogos)
CREATE POLICY "Anyone can view catalogo images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'catalogos');

CREATE POLICY "Authenticated users can upload catalogo images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'catalogos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own catalogo images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'catalogos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own catalogo images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'catalogos' AND auth.role() = 'authenticated');