-- Criar assinatura Nexsiles Max para o usuário (1 ano de validade)
INSERT INTO public.assinaturas (
  user_id,
  plano,
  status,
  data_inicio,
  data_vencimento,
  valor_mensal,
  metodo_pagamento,
  trial_ativo
) VALUES (
  '756d71fb-636c-4579-bf82-59b821630679',
  'nexsiles_max',
  'ativo',
  NOW(),
  NOW() + INTERVAL '1 year',
  0,
  'cortesia',
  false
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  plano = 'nexsiles_max',
  status = 'ativo',
  data_inicio = NOW(),
  data_vencimento = NOW() + INTERVAL '1 year',
  valor_mensal = 0,
  metodo_pagamento = 'cortesia',
  updated_at = NOW();