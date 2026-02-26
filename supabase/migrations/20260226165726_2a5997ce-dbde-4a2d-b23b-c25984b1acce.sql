
-- ========== FIDELIDADE TABLES ==========

-- Níveis de Fidelidade
CREATE TABLE public.niveis_fidelidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  nome TEXT NOT NULL,
  pontos_minimos INTEGER NOT NULL DEFAULT 0,
  beneficios TEXT,
  cor TEXT NOT NULL DEFAULT '#9b87f5',
  icone TEXT,
  desconto_percentual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.niveis_fidelidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "niveis_fidelidade_select" ON public.niveis_fidelidade
  FOR SELECT USING (organization_id = get_user_organization_id() OR user_id = auth.uid());

CREATE POLICY "niveis_fidelidade_insert" ON public.niveis_fidelidade
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "niveis_fidelidade_update" ON public.niveis_fidelidade
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "niveis_fidelidade_delete" ON public.niveis_fidelidade
  FOR DELETE USING (user_id = auth.uid());

-- Pontos de Fidelidade por Cliente
CREATE TABLE public.pontos_fidelidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  pontos_totais INTEGER NOT NULL DEFAULT 0,
  pontos_disponiveis INTEGER NOT NULL DEFAULT 0,
  nivel_atual_id UUID REFERENCES public.niveis_fidelidade(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pontos_fidelidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pontos_fidelidade_select" ON public.pontos_fidelidade
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "pontos_fidelidade_insert" ON public.pontos_fidelidade
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "pontos_fidelidade_update" ON public.pontos_fidelidade
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "pontos_fidelidade_delete" ON public.pontos_fidelidade
  FOR DELETE USING (user_id = auth.uid());

-- Movimentos de Pontos
CREATE TABLE public.movimentos_pontos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pontos_fidelidade_id UUID NOT NULL REFERENCES public.pontos_fidelidade(id) ON DELETE CASCADE,
  venda_id UUID REFERENCES public.vendas(id),
  tipo TEXT NOT NULL DEFAULT 'credito',
  quantidade INTEGER NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentos_pontos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimentos_pontos_select" ON public.movimentos_pontos
  FOR SELECT USING (
    pontos_fidelidade_id IN (
      SELECT id FROM public.pontos_fidelidade WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "movimentos_pontos_insert" ON public.movimentos_pontos
  FOR INSERT WITH CHECK (
    pontos_fidelidade_id IN (
      SELECT id FROM public.pontos_fidelidade WHERE user_id = auth.uid()
    )
  );

-- Recompensas de Fidelidade
CREATE TABLE public.recompensas_fidelidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  pontos_necessarios INTEGER NOT NULL DEFAULT 100,
  tipo TEXT NOT NULL DEFAULT 'desconto',
  valor_desconto NUMERIC,
  produto_id UUID REFERENCES public.pecas(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  quantidade_disponivel INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recompensas_fidelidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recompensas_fidelidade_select" ON public.recompensas_fidelidade
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "recompensas_fidelidade_insert" ON public.recompensas_fidelidade
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "recompensas_fidelidade_update" ON public.recompensas_fidelidade
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "recompensas_fidelidade_delete" ON public.recompensas_fidelidade
  FOR DELETE USING (user_id = auth.uid());

-- Trigger para updated_at em pontos_fidelidade
CREATE TRIGGER update_pontos_fidelidade_updated_at
  BEFORE UPDATE ON public.pontos_fidelidade
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
