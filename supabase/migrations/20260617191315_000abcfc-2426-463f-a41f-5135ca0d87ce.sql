DO $$
BEGIN
  PERFORM cron.unschedule('process-webhook-queue-every-minute');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'process-webhook-queue-every-minute',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/process-webhook-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb2Zud2N2cHpxbGhhZ2VqZ2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjIwMDAsImV4cCI6MjA4NDgzODAwMH0.kCxv9nbZ7eph4T09WYgbUednAQeW0Slutet08G9svXc'
    ),
    body := '{}'::jsonb
  );
  $cron$
);