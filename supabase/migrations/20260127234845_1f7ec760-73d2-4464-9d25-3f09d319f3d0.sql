-- Add data_retorno column to envios_galvanica
ALTER TABLE public.envios_galvanica
ADD COLUMN IF NOT EXISTS data_retorno TIMESTAMPTZ;