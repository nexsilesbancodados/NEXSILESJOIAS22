-- Adicionar campos de personalização visual à tabela maletas
ALTER TABLE public.maletas
ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS cor_secundaria text DEFAULT '#EC4899',
ADD COLUMN IF NOT EXISTS imagem_capa text;

-- Criar bucket para imagens de maletas
INSERT INTO storage.buckets (id, name, public)
VALUES ('maletas-images', 'maletas-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de storage para o bucket
CREATE POLICY "Authenticated users can upload maleta images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'maletas-images');

CREATE POLICY "Anyone can view maleta images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'maletas-images');

CREATE POLICY "Authenticated users can update own maleta images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'maletas-images');

CREATE POLICY "Authenticated users can delete own maleta images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'maletas-images');