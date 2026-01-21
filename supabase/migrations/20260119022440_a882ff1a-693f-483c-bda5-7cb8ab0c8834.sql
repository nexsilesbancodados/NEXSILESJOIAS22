-- =============================================
-- STORAGE BUCKETS PARA IMAGENS
-- =============================================

-- Bucket para imagens de peças
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pecas', 'pecas', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Bucket para imagens de catálogos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('catalogos', 'catalogos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Bucket para avatares de usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Políticas para bucket de peças
CREATE POLICY "Imagens de peças são públicas" ON storage.objects FOR SELECT USING (bucket_id = 'pecas');
CREATE POLICY "Usuários autenticados podem upload peças" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pecas' AND auth.role() = 'authenticated');
CREATE POLICY "Usuários podem atualizar suas imagens de peças" ON storage.objects FOR UPDATE USING (bucket_id = 'pecas' AND auth.role() = 'authenticated');
CREATE POLICY "Usuários podem deletar suas imagens de peças" ON storage.objects FOR DELETE USING (bucket_id = 'pecas' AND auth.role() = 'authenticated');

-- Políticas para bucket de catálogos
CREATE POLICY "Imagens de catálogos são públicas" ON storage.objects FOR SELECT USING (bucket_id = 'catalogos');
CREATE POLICY "Usuários autenticados podem upload catálogos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'catalogos' AND auth.role() = 'authenticated');
CREATE POLICY "Usuários podem atualizar imagens de catálogos" ON storage.objects FOR UPDATE USING (bucket_id = 'catalogos' AND auth.role() = 'authenticated');
CREATE POLICY "Usuários podem deletar imagens de catálogos" ON storage.objects FOR DELETE USING (bucket_id = 'catalogos' AND auth.role() = 'authenticated');

-- Políticas para bucket de avatares
CREATE POLICY "Avatares são públicos" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Usuários podem upload próprio avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Usuários podem atualizar próprio avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Usuários podem deletar próprio avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');