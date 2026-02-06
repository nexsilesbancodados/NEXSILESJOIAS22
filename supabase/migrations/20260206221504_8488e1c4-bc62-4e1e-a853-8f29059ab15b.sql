-- Tabela de códigos de acesso gerados após pagamento
CREATE TABLE public.codigos_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(12) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  plano VARCHAR(50) NOT NULL,
  valor_pago NUMERIC(10,2) NOT NULL,
  mercadopago_payment_id VARCHAR(255),
  usado BOOLEAN DEFAULT false,
  usado_por UUID REFERENCES auth.users(id),
  usado_em TIMESTAMP WITH TIME ZONE,
  valido_ate TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX idx_codigos_acesso_codigo ON public.codigos_acesso(codigo);
CREATE INDEX idx_codigos_acesso_email ON public.codigos_acesso(email);
CREATE INDEX idx_codigos_acesso_usado ON public.codigos_acesso(usado) WHERE usado = false;

-- RLS
ALTER TABLE public.codigos_acesso ENABLE ROW LEVEL SECURITY;

-- Política: códigos podem ser verificados publicamente (para validar no cadastro)
CREATE POLICY "Códigos podem ser verificados publicamente"
ON public.codigos_acesso
FOR SELECT
USING (true);

-- Política: somente sistema pode inserir/atualizar (via service role)
-- Não criamos política de INSERT/UPDATE para usuários normais

-- Função para gerar código aleatório
CREATE OR REPLACE FUNCTION public.gerar_codigo_acesso()
RETURNS VARCHAR(12)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(12) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Comentários
COMMENT ON TABLE public.codigos_acesso IS 'Códigos de acesso gerados após pagamento para liberar cadastro';
COMMENT ON COLUMN public.codigos_acesso.codigo IS 'Código único de 12 caracteres enviado por email';
COMMENT ON COLUMN public.codigos_acesso.valido_ate IS 'Data limite para usar o código (30 dias após geração)';