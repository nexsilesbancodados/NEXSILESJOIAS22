-- Habilitar extensão pg_cron para agendamento de jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Habilitar extensão pg_net para fazer requisições HTTP
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Conceder permissões necessárias
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Criar o cron job para verificar assinaturas diariamente às 8h BRT (11:00 UTC)
SELECT cron.schedule(
  'verificar-assinaturas-diario',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/verificar-assinaturas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb2Zud2N2cHpxbGhhZ2VqZ2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjIwMDAsImV4cCI6MjA4NDgzODAwMH0.kCxv9nbZ7eph4T09WYgbUednAQeW0Slutet08G9svXc'
    ),
    body := jsonb_build_object('triggered_at', now()::text, 'source', 'cron')
  ) AS request_id;
  $$
);