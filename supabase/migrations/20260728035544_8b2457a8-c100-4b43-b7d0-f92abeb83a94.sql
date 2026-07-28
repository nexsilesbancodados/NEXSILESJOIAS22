
-- 1) Adiciona periodo em codigos_acesso
ALTER TABLE public.codigos_acesso
  ADD COLUMN IF NOT EXISTS periodo TEXT NOT NULL DEFAULT 'mensal'
  CHECK (periodo IN ('mensal','anual'));

-- 2) RPC pública segura para o polling da landing (retorna no máximo 1 código pendente do email)
CREATE OR REPLACE FUNCTION public.get_pending_access_code(p_email TEXT)
RETURNS TABLE(codigo TEXT, plano TEXT, periodo TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ca.codigo::text, ca.plano::text, ca.periodo::text
  FROM public.codigos_acesso ca
  WHERE lower(ca.email) = lower(p_email)
    AND ca.usado = false
    AND ca.valido_ate > now()
  ORDER BY ca.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_pending_access_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_access_code(TEXT) TO anon, authenticated;

-- 3) Remove a policy permissiva anterior (enumeração pública) e mantém só a de UPDATE controlada
DROP POLICY IF EXISTS codigos_acesso_select_by_code ON public.codigos_acesso;

-- Reintroduz SELECT restrito: só usuários autenticados que já usaram o código (dono) veem
CREATE POLICY codigos_acesso_owner_select
  ON public.codigos_acesso FOR SELECT
  TO authenticated
  USING (usado_por = auth.uid());

-- 4) Trigger de ativação automática no primeiro login (mesmo email do checkout)
CREATE OR REPLACE FUNCTION public.ativar_codigo_no_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code   public.codigos_acesso%ROWTYPE;
  v_dias   INT;
  v_valor  NUMERIC;
BEGIN
  -- Só corre para usuários "admin" (donos de conta); funcionários não recebem código.
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'admin') = 'user' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_code
  FROM public.codigos_acesso
  WHERE lower(email) = lower(NEW.email)
    AND usado = false
    AND valido_ate > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_dias  := CASE WHEN v_code.periodo = 'anual' THEN 365 ELSE 30 END;
  v_valor := CASE WHEN v_code.periodo = 'anual' THEN v_code.valor_pago / 12.0 ELSE v_code.valor_pago END;

  INSERT INTO public.assinaturas (
    user_id, plano, status, data_inicio, data_vencimento,
    valor_mensal, metodo_pagamento, mercadopago_payment_id, trial_ativo
  ) VALUES (
    NEW.id, v_code.plano, 'ativo', now(), now() + make_interval(days => v_dias),
    v_valor, 'pix', v_code.mercadopago_payment_id, false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plano = EXCLUDED.plano,
    status = 'ativo',
    data_inicio = EXCLUDED.data_inicio,
    data_vencimento = EXCLUDED.data_vencimento,
    valor_mensal = EXCLUDED.valor_mensal,
    mercadopago_payment_id = COALESCE(EXCLUDED.mercadopago_payment_id, public.assinaturas.mercadopago_payment_id);

  UPDATE public.codigos_acesso
  SET usado = true, usado_por = NEW.id, usado_em = now()
  WHERE id = v_code.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ativar_codigo_no_signup falhou para %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_activate_code ON auth.users;
CREATE TRIGGER on_auth_user_created_activate_code
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ativar_codigo_no_signup();
