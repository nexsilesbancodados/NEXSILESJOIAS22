-- Create catalogos table for managing purchase links/catalogs
CREATE TABLE public.catalogos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_preparacao',
  observacao TEXT,
  custo_separacao NUMERIC(10,2) DEFAULT 0,
  custo_operacional NUMERIC(10,2) DEFAULT 0,
  taxa_entrega NUMERIC(10,2) DEFAULT 0,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catalogo_itens table for items in each catalog
CREATE TABLE public.catalogo_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalogo_id UUID NOT NULL REFERENCES public.catalogos(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_itens ENABLE ROW LEVEL SECURITY;

-- RLS policies for catalogos
CREATE POLICY "Authenticated users can view catalogos"
ON public.catalogos FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create catalogos"
ON public.catalogos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update catalogos"
ON public.catalogos FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete catalogos"
ON public.catalogos FOR DELETE
USING (auth.role() = 'authenticated');

-- RLS policies for catalogo_itens
CREATE POLICY "Authenticated users can view catalogo_itens"
ON public.catalogo_itens FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create catalogo_itens"
ON public.catalogo_itens FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update catalogo_itens"
ON public.catalogo_itens FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete catalogo_itens"
ON public.catalogo_itens FOR DELETE
USING (auth.role() = 'authenticated');