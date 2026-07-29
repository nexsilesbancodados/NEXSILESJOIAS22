
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  finalidade TEXT NOT NULL,
  versao TEXT NOT NULL DEFAULT '1.0',
  aceito BOOLEAN NOT NULL DEFAULT TRUE,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id);
GRANT SELECT, INSERT ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own consents" ON public.user_consents;
CREATE POLICY "Users read own consents" ON public.user_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own consents" ON public.user_consents;
CREATE POLICY "Users insert own consents" ON public.user_consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
