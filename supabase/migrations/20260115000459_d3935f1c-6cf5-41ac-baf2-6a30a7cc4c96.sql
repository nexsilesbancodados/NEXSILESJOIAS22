-- Create table for catalog orders
CREATE TABLE public.pedidos_catalogo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalogo_id UUID NOT NULL REFERENCES public.catalogos(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  custos_adicionais NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for order items
CREATE TABLE public.pedidos_catalogo_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos_catalogo(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id),
  peca_nome TEXT NOT NULL,
  peca_codigo TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pedidos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_catalogo_itens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT orders (public catalog)
CREATE POLICY "Anyone can create catalog orders"
ON public.pedidos_catalogo
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to view all orders
CREATE POLICY "Authenticated users can view catalog orders"
ON public.pedidos_catalogo
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to update orders
CREATE POLICY "Authenticated users can update catalog orders"
ON public.pedidos_catalogo
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete orders
CREATE POLICY "Authenticated users can delete catalog orders"
ON public.pedidos_catalogo
FOR DELETE
USING (auth.role() = 'authenticated');

-- Allow anyone to INSERT order items
CREATE POLICY "Anyone can create catalog order items"
ON public.pedidos_catalogo_itens
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to view order items
CREATE POLICY "Authenticated users can view catalog order items"
ON public.pedidos_catalogo_itens
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete order items
CREATE POLICY "Authenticated users can delete catalog order items"
ON public.pedidos_catalogo_itens
FOR DELETE
USING (auth.role() = 'authenticated');

-- Add index for performance
CREATE INDEX idx_pedidos_catalogo_catalogo_id ON public.pedidos_catalogo(catalogo_id);
CREATE INDEX idx_pedidos_catalogo_status ON public.pedidos_catalogo(status);
CREATE INDEX idx_pedidos_catalogo_itens_pedido_id ON public.pedidos_catalogo_itens(pedido_id);