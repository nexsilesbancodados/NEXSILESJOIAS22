INSERT INTO assinaturas (user_id, plano, status, data_inicio, data_vencimento, valor_mensal, metodo_pagamento)
VALUES (
  'bbad0fcb-5459-4468-aaf9-9cf3688c55c2',
  'nexsiles',
  'ativo',
  now(),
  now() + interval '30 days',
  1.00,
  'pix'
);