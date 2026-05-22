
-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits (identifier, endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON public.rate_limits (created_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_service_only" ON public.rate_limits;
CREATE POLICY "rate_limits_service_only" ON public.rate_limits
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- check_rate_limit RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INT DEFAULT 60,
  p_window_seconds INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND created_at > now() - (p_window_seconds || ' seconds')::interval;
  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;
  INSERT INTO public.rate_limits (identifier, endpoint) VALUES (p_identifier, p_endpoint);
  RETURN true;
END;
$$;

-- Cleanup old rate_limits rows (>1h)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - INTERVAL '1 hour';
$$;

-- Webhook queue for async processing
CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_queue_pending ON public.webhook_queue (status, created_at) WHERE status = 'pending';

ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_queue_service_only" ON public.webhook_queue;
CREATE POLICY "webhook_queue_service_only" ON public.webhook_queue
  FOR ALL TO authenticated USING (false) WITH CHECK (false);
