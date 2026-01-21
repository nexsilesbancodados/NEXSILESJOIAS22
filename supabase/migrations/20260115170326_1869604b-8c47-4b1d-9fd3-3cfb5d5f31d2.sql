-- Add imagem_url column to catalogos table for catalog cover image
ALTER TABLE public.catalogos ADD COLUMN IF NOT EXISTS imagem_url text;