-- Create campaigns table for promotions and coupons
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('percentual', 'valor_fixo', 'frete_gratis')) NOT NULL,
  valor DECIMAL DEFAULT 0,
  codigo_cupom TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  limite_uso INTEGER,
  usos_atuais INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  categorias TEXT[],
  pecas_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own campaigns" ON public.campanhas
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns" ON public.campanhas
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON public.campanhas
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON public.campanhas
FOR DELETE USING (auth.uid() = user_id);

-- Policy for public catalog to validate coupons (read-only for active coupons)
CREATE POLICY "Public can read active coupons by code" ON public.campanhas
FOR SELECT USING (
  ativo = true 
  AND codigo_cupom IS NOT NULL 
  AND (data_inicio IS NULL OR data_inicio <= now())
  AND (data_fim IS NULL OR data_fim >= now())
  AND (limite_uso IS NULL OR usos_atuais < limite_uso)
);

-- Unique index for coupon codes (case-insensitive)
CREATE UNIQUE INDEX campanhas_codigo_cupom_unique 
ON public.campanhas(UPPER(codigo_cupom)) WHERE codigo_cupom IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_campanhas_updated_at
BEFORE UPDATE ON public.campanhas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validar_cupom(p_codigo TEXT, p_user_id UUID)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  tipo TEXT,
  valor DECIMAL,
  valido BOOLEAN,
  mensagem TEXT
) AS $$
DECLARE
  v_campanha public.campanhas%ROWTYPE;
BEGIN
  SELECT * INTO v_campanha
  FROM public.campanhas c
  WHERE UPPER(c.codigo_cupom) = UPPER(p_codigo)
    AND c.user_id = p_user_id
    AND c.ativo = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::DECIMAL, false, 'Cupom não encontrado'::TEXT;
    RETURN;
  END IF;

  IF v_campanha.data_inicio IS NOT NULL AND v_campanha.data_inicio > now() THEN
    RETURN QUERY SELECT v_campanha.id, v_campanha.nome, v_campanha.tipo, v_campanha.valor, false, 'Cupom ainda não está válido'::TEXT;
    RETURN;
  END IF;

  IF v_campanha.data_fim IS NOT NULL AND v_campanha.data_fim < now() THEN
    RETURN QUERY SELECT v_campanha.id, v_campanha.nome, v_campanha.tipo, v_campanha.valor, false, 'Cupom expirado'::TEXT;
    RETURN;
  END IF;

  IF v_campanha.limite_uso IS NOT NULL AND v_campanha.usos_atuais >= v_campanha.limite_uso THEN
    RETURN QUERY SELECT v_campanha.id, v_campanha.nome, v_campanha.tipo, v_campanha.valor, false, 'Limite de uso atingido'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_campanha.id, v_campanha.nome, v_campanha.tipo, v_campanha.valor, true, 'Cupom válido!'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION public.usar_cupom(p_campanha_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.campanhas
  SET usos_atuais = usos_atuais + 1
  WHERE id = p_campanha_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;