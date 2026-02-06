-- Adicionar campos para controle de trial nas assinaturas
ALTER TABLE public.assinaturas 
ADD COLUMN IF NOT EXISTS trial_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_iniciado_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_dias integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS metodo_pagamento text DEFAULT 'pix',
ADD COLUMN IF NOT EXISTS pagamento_recorrente boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ultimo_pagamento_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS proximo_pagamento_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS mercadopago_preference_id text,
ADD COLUMN IF NOT EXISTS mercadopago_payment_id text;

-- Criar índice para buscar trials ativos
CREATE INDEX IF NOT EXISTS idx_assinaturas_trial ON public.assinaturas(trial_ativo, trial_iniciado_em) 
WHERE trial_ativo = true;

-- Comentários para documentação
COMMENT ON COLUMN public.assinaturas.trial_ativo IS 'Indica se o usuário está no período de trial';
COMMENT ON COLUMN public.assinaturas.trial_iniciado_em IS 'Data de início do trial (3 dias grátis)';
COMMENT ON COLUMN public.assinaturas.trial_dias IS 'Duração do trial em dias (padrão: 3)';
COMMENT ON COLUMN public.assinaturas.metodo_pagamento IS 'pix, boleto, cartao';
COMMENT ON COLUMN public.assinaturas.pagamento_recorrente IS 'Se true, cobrança automática via cartão';