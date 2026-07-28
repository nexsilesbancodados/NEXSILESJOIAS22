-- Hot query #1: maletas WHERE status='aberta' AND data_devolucao IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_maletas_status_devolucao
  ON public.maletas (status, data_devolucao)
  WHERE data_devolucao IS NOT NULL;

-- Hot query #2: pecas ORDER BY nome ASC (com filtro catalogo_only)
CREATE INDEX IF NOT EXISTS idx_pecas_org_nome
  ON public.pecas (organization_id, nome);

-- Hot query #3: webhook_queue WHERE status='pending' AND attempts<N ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_webhook_queue_pending
  ON public.webhook_queue (status, attempts, created_at)
  WHERE status = 'pending';