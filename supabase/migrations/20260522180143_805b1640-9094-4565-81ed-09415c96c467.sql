
ALTER TABLE public.envios DROP CONSTRAINT IF EXISTS envios_maleta_id_fkey;
ALTER TABLE public.envios
  ADD CONSTRAINT envios_maleta_id_fkey
  FOREIGN KEY (maleta_id) REFERENCES public.maletas(id) ON DELETE SET NULL;
