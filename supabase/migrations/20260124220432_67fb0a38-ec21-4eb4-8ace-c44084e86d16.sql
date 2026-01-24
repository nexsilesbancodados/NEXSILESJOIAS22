-- Tabela de sessões do caixa
CREATE TABLE public.caixa_sessoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  valor_inicial NUMERIC NOT NULL DEFAULT 0,
  valor_final NUMERIC,
  valor_vendas NUMERIC DEFAULT 0,
  valor_sangrias NUMERIC DEFAULT 0,
  valor_suprimentos NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto',
  operador_id UUID REFERENCES auth.users(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de movimentos do caixa
CREATE TABLE public.movimentos_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sessao_id UUID NOT NULL REFERENCES public.caixa_sessoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'sangria', 'suprimento', 'venda', 'troca', 'devolucao'
  valor NUMERIC NOT NULL,
  descricao TEXT,
  venda_id UUID REFERENCES public.vendas(id),
  operador_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.caixa_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentos_caixa ENABLE ROW LEVEL SECURITY;

-- Políticas para caixa_sessoes
CREATE POLICY "Authenticated can view caixa_sessoes"
ON public.caixa_sessoes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated can create caixa_sessoes"
ON public.caixa_sessoes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated can update caixa_sessoes"
ON public.caixa_sessoes
FOR UPDATE
USING (true);

-- Políticas para movimentos_caixa
CREATE POLICY "Authenticated can view movimentos_caixa"
ON public.movimentos_caixa
FOR SELECT
USING (true);

CREATE POLICY "Authenticated can create movimentos_caixa"
ON public.movimentos_caixa
FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_caixa_sessoes_updated_at
BEFORE UPDATE ON public.caixa_sessoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_caixa_sessoes_status ON public.caixa_sessoes(status);
CREATE INDEX idx_caixa_sessoes_data_abertura ON public.caixa_sessoes(data_abertura);
CREATE INDEX idx_movimentos_caixa_sessao ON public.movimentos_caixa(sessao_id);
CREATE INDEX idx_movimentos_caixa_tipo ON public.movimentos_caixa(tipo);