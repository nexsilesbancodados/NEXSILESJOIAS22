-- First, update any existing negative stock values to 0
UPDATE public.pecas SET estoque = 0 WHERE estoque < 0 OR estoque IS NULL;

-- Now add CHECK constraint to prevent negative stock
ALTER TABLE public.pecas 
ADD CONSTRAINT pecas_estoque_non_negative 
CHECK (estoque >= 0);