-- Criar bucket para imagens de peças
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pecas', 'pecas', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para imagens de catálogos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('catalogos', 'catalogos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para avatares de usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Imagens de peças são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem upload peças" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas imagens de peças" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar suas imagens de peças" ON storage.objects;
DROP POLICY IF EXISTS "Imagens de catálogos são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem upload catálogos" ON storage.objects;
DROP POLICY IF EXISTS "Avatars são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem upload avatars" ON storage.objects;

-- Políticas para bucket de peças
CREATE POLICY "pecas_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'pecas');
CREATE POLICY "pecas_insert_authenticated" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pecas' AND auth.role() = 'authenticated');
CREATE POLICY "pecas_update_authenticated" ON storage.objects FOR UPDATE USING (bucket_id = 'pecas' AND auth.role() = 'authenticated');
CREATE POLICY "pecas_delete_authenticated" ON storage.objects FOR DELETE USING (bucket_id = 'pecas' AND auth.role() = 'authenticated');

-- Políticas para bucket de catálogos
CREATE POLICY "catalogos_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'catalogos');
CREATE POLICY "catalogos_insert_authenticated" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'catalogos' AND auth.role() = 'authenticated');

-- Políticas para bucket de avatars
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_authenticated" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_update_authenticated" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');