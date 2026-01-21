-- Create storage bucket for piece images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pecas-images', 'pecas-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Anyone can view piece images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pecas-images');

CREATE POLICY "Authenticated users can upload piece images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pecas-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update piece images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pecas-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete piece images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pecas-images' 
  AND auth.role() = 'authenticated'
);