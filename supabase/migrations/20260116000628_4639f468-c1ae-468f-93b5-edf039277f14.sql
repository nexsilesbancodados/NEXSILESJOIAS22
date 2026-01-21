-- =====================================================
-- FUNÇÃO: update_updated_at_column
-- Atualiza automaticamente o campo updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- TABELA: banhos
-- Armazena os tipos de banho/acabamento disponíveis
-- =====================================================
CREATE TABLE public.banhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  nome text NOT NULL,
  cor text DEFAULT '#C0C0C0',
  descricao text,
  espessura text,
  milesimos text,
  preco_custo numeric DEFAULT 0,
  custo_frete numeric DEFAULT 0,
  numero_pecas integer DEFAULT 0,
  descricao_peca text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banhos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banhos
CREATE POLICY "Users can view their own banhos" 
ON public.banhos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own banhos" 
ON public.banhos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banhos" 
ON public.banhos FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own banhos" 
ON public.banhos FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_banhos_updated_at
BEFORE UPDATE ON public.banhos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABELA: envios_galvanica
-- Controla os envios de peças para galvanoplastia
-- =====================================================
CREATE TABLE public.envios_galvanica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  data_envio date NOT NULL,
  data_previsao_retorno date,
  status text DEFAULT 'pendente',
  tipo_banho text NOT NULL,
  quantidade_pecas integer DEFAULT 0,
  peso_total numeric,
  descricao_pecas text,
  observacoes text,
  remetente_nome text,
  remetente_empresa text,
  remetente_endereco text,
  remetente_cidade text,
  remetente_estado text DEFAULT 'SP',
  remetente_cep text,
  remetente_telefone text,
  remetente_email text,
  destinatario_nome text,
  destinatario_empresa text NOT NULL,
  destinatario_endereco text,
  destinatario_cidade text,
  destinatario_estado text DEFAULT 'SP',
  destinatario_cep text,
  destinatario_telefone text,
  destinatario_email text,
  custo_servico numeric DEFAULT 0,
  custo_frete numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.envios_galvanica ENABLE ROW LEVEL SECURITY;

-- RLS Policies for envios_galvanica
CREATE POLICY "Users can view their own envios" 
ON public.envios_galvanica FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own envios" 
ON public.envios_galvanica FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own envios" 
ON public.envios_galvanica FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own envios" 
ON public.envios_galvanica FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_envios_galvanica_updated_at
BEFORE UPDATE ON public.envios_galvanica
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABELA: modelos_etiquetas
-- Armazena modelos personalizados de etiquetas
-- =====================================================
CREATE TABLE public.modelos_etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  nome text NOT NULL,
  tipo text DEFAULT 'preco',
  formato text DEFAULT 'retangular',
  tamanho_id text,
  largura numeric DEFAULT 50,
  altura numeric DEFAULT 30,
  cor_fundo text DEFAULT '#FFFFFF',
  cor_texto text DEFAULT '#000000',
  cor_borda text DEFAULT '#D4AF37',
  fonte text DEFAULT 'Arial',
  tamanho_fonte integer DEFAULT 10,
  mostrar_logo boolean DEFAULT false,
  mostrar_preco boolean DEFAULT true,
  mostrar_codigo boolean DEFAULT true,
  mostrar_nome boolean DEFAULT true,
  mostrar_qrcode boolean DEFAULT false,
  mostrar_codigo_barras boolean DEFAULT false,
  mostrar_banho boolean DEFAULT false,
  mostrar_numeracao boolean DEFAULT false,
  borda_arredondada integer DEFAULT 4,
  margem_interna integer DEFAULT 4,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.modelos_etiquetas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for modelos_etiquetas
CREATE POLICY "Users can view their own modelos" 
ON public.modelos_etiquetas FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own modelos" 
ON public.modelos_etiquetas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own modelos" 
ON public.modelos_etiquetas FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own modelos" 
ON public.modelos_etiquetas FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_modelos_etiquetas_updated_at
BEFORE UPDATE ON public.modelos_etiquetas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();