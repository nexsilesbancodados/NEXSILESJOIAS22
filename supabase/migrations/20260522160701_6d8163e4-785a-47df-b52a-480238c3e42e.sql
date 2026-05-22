CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cancelled','completed')),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deletion_pending ON public.account_deletion_requests (status, scheduled_for) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_pending_per_user ON public.account_deletion_requests (user_id) WHERE status = 'pending';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own_deletion_requests" ON public.account_deletion_requests;
CREATE POLICY "user_own_deletion_requests" ON public.account_deletion_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_create_own_deletion" ON public.account_deletion_requests;
CREATE POLICY "user_create_own_deletion" ON public.account_deletion_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_cancel_own_deletion" ON public.account_deletion_requests;
CREATE POLICY "user_cancel_own_deletion" ON public.account_deletion_requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status IN ('cancelled','pending'));

COMMENT ON TABLE public.account_deletion_requests IS 'LGPD: solicitações de exclusão de conta com período de carência de 30 dias';