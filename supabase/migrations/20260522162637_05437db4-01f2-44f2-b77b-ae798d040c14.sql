
-- 1) Maleta numero sequencial
ALTER TABLE public.maletas ADD COLUMN IF NOT EXISTS numero_sequencial INTEGER;

CREATE OR REPLACE FUNCTION public.gerar_numero_maleta()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.numero_sequencial IS NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT COALESCE(MAX(numero_sequencial), 0) + 1 INTO NEW.numero_sequencial
    FROM public.maletas WHERE organization_id = NEW.organization_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_gerar_numero_maleta ON public.maletas;
CREATE TRIGGER trg_gerar_numero_maleta BEFORE INSERT ON public.maletas
FOR EACH ROW EXECUTE FUNCTION public.gerar_numero_maleta();

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at) AS n
  FROM public.maletas WHERE numero_sequencial IS NULL
)
UPDATE public.maletas m SET numero_sequencial = r.n FROM ranked r WHERE m.id = r.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_maletas_org_numero
  ON public.maletas(organization_id, numero_sequencial) WHERE organization_id IS NOT NULL;

-- 2) Pecas: lote + codigo auto
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS lote TEXT;

CREATE OR REPLACE FUNCTION public.gerar_codigo_peca()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_seq INT;
BEGIN
  IF NEW.codigo IS NULL OR trim(NEW.codigo) = '' THEN
    SELECT COUNT(*) + 1 INTO v_seq FROM public.pecas WHERE organization_id = NEW.organization_id;
    NEW.codigo := 'PC-' || LPAD(v_seq::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_gerar_codigo_peca ON public.pecas;
CREATE TRIGGER trg_gerar_codigo_peca BEFORE INSERT ON public.pecas
FOR EACH ROW EXECUTE FUNCTION public.gerar_codigo_peca();

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at) AS n
  FROM public.pecas WHERE codigo IS NULL OR trim(codigo) = ''
)
UPDATE public.pecas p SET codigo = 'PC-' || LPAD(r.n::text, 6, '0') FROM ranked r WHERE p.id = r.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pecas_org_codigo
  ON public.pecas(organization_id, codigo) WHERE codigo IS NOT NULL AND organization_id IS NOT NULL;

-- 3) maletas_pecas
ALTER TABLE public.maletas_pecas
  ADD COLUMN IF NOT EXISTS data_devolucao DATE,
  ADD COLUMN IF NOT EXISTS motivo_devolucao TEXT;

-- 4) maleta_conferencias
CREATE TABLE IF NOT EXISTS public.maleta_conferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  user_id UUID,
  usuario_nome TEXT,
  tipo TEXT NOT NULL DEFAULT 'fechamento',
  itens_conferidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_itens INT NOT NULL DEFAULT 0,
  total_conferidos INT NOT NULL DEFAULT 0,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'concluida',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maleta_conferencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view conferencias" ON public.maleta_conferencias FOR SELECT
  USING (public.user_is_member_of_org(organization_id));
CREATE POLICY "Members insert conferencias" ON public.maleta_conferencias FOR INSERT
  WITH CHECK (public.user_is_member_of_org(organization_id));
CREATE INDEX IF NOT EXISTS idx_maleta_conferencias_maleta ON public.maleta_conferencias(maleta_id);

-- 5) maleta_devolucoes
CREATE TABLE IF NOT EXISTS public.maleta_devolucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  maleta_peca_id UUID REFERENCES public.maletas_pecas(id) ON DELETE SET NULL,
  peca_id UUID,
  organization_id UUID NOT NULL,
  quantidade INT NOT NULL,
  motivo TEXT,
  user_id UUID,
  usuario_nome TEXT,
  data_devolucao DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maleta_devolucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view devolucoes" ON public.maleta_devolucoes FOR SELECT
  USING (public.user_is_member_of_org(organization_id));
CREATE POLICY "Members insert devolucoes" ON public.maleta_devolucoes FOR INSERT
  WITH CHECK (public.user_is_member_of_org(organization_id));
CREATE INDEX IF NOT EXISTS idx_maleta_devolucoes_maleta ON public.maleta_devolucoes(maleta_id);
