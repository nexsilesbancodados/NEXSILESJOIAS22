
-- Atualizar assinatura para vitalícia
UPDATE public.assinaturas 
SET data_vencimento = '2099-12-31 23:59:59+00',
    plano = 'nexsiles_max',
    status = 'ativo',
    valor_mensal = 0,
    metodo_pagamento = 'cortesia_admin',
    updated_at = now()
WHERE user_id = '756d71fb-636c-4579-bf82-59b821630679';

-- Marcar como super admin
UPDATE public.profiles 
SET is_super_admin = true, updated_at = now()
WHERE user_id = '756d71fb-636c-4579-bf82-59b821630679';
