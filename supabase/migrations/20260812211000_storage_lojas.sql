-- Assets da vitrine separados das fotos de peças e catálogos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('lojas', 'lojas', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "lojas_public_read" ON storage.objects;
CREATE POLICY "lojas_public_read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'lojas');

DROP POLICY IF EXISTS "lojas_authenticated_insert" ON storage.objects;
CREATE POLICY "lojas_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'lojas'
    AND (storage.foldername(name))[1] = public.get_user_organization_id()::text
  );

DROP POLICY IF EXISTS "lojas_owner_or_org_update" ON storage.objects;
CREATE POLICY "lojas_owner_or_org_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'lojas'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = public.get_user_organization_id()::text)
  );

DROP POLICY IF EXISTS "lojas_owner_or_org_delete" ON storage.objects;
CREATE POLICY "lojas_owner_or_org_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'lojas'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = public.get_user_organization_id()::text)
  );
