
CREATE OR REPLACE FUNCTION public.cleanup_webhook_queue()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.webhook_queue
  WHERE created_at < now() - INTERVAL '7 days'
    AND status IN ('processed', 'failed', 'success', 'error');
$$;

CREATE OR REPLACE FUNCTION public.cleanup_edge_function_errors()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.edge_function_errors
  WHERE created_at < now() - INTERVAL '30 days';
$$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT jobname FROM cron.job WHERE jobname IN (
    'cleanup-rate-limits-hourly',
    'cleanup-webhook-queue-daily',
    'cleanup-edge-function-errors-daily'
  ) LOOP
    PERFORM cron.unschedule(r.jobname);
  END LOOP;
END $$;

SELECT cron.schedule(
  'cleanup-rate-limits-hourly',
  '0 * * * *',
  $$SELECT public.cleanup_rate_limits();$$
);

SELECT cron.schedule(
  'cleanup-webhook-queue-daily',
  '15 3 * * *',
  $$SELECT public.cleanup_webhook_queue();$$
);

SELECT cron.schedule(
  'cleanup-edge-function-errors-daily',
  '30 3 * * *',
  $$SELECT public.cleanup_edge_function_errors();$$
);
