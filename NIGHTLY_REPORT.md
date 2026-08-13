# Relatório de engenharia autônoma — 2026-08-13

## Estado inicial

- Branch: `main`, inicialmente limpa e alinhada com `origin/main`.
- Commit inicial: `fe1dd7a` (`fix: harden app flows and route coverage`).
- Stack: React + Vite + TypeScript, Supabase (migrations e Edge Functions), Lovable.
- O repositório não possui workflow de CI no GitHub. O README documenta a aplicação publicada em `https://nexsiles2567.lovable.app`.
- Supabase CLI, `psql`, Deno e credenciais de deploy remoto não estavam disponíveis. Nenhum dado, usuário ou banco remoto foi alterado nesta sessão.

## Revisão cruzada

Claude fez uma auditoria somente leitura da arquitetura, 38 Edge Functions, migrations, páginas críticas, segurança, performance e testes. O relatório identificou, entre outros pontos, dois vazamentos críticos de credenciais, validação cross-conta permissiva em webhook, idempotência concorrente de pagamentos, oversell silencioso no PDV e o aviso de importação dinâmica/estática do IndexedDB. Nenhum arquivo foi editado pelo revisor.

## Implementado

- Nova migration `20260813000000_hardening_agent_config_and_webhook_queue.sql`:
  - remove o SELECT anônimo direto de `agente_ia_config` e `ecommerce_config`;
  - mantém as views públicas como superfície anônima e restringe o acesso da tabela-base às colunas públicas;
  - fecha a view pública do agente com `security_invoker = false`;
  - cria índices únicos parciais para `mercadopago_payment_id` em pedidos e códigos de acesso;
  - faz `ajustar_estoque_peca` rejeitar baixa que deixaria estoque negativo, com lock da linha.
- `process-webhook-queue` agora exige `CRON_SECRET` configurado ou chamada interna com `SUPABASE_SERVICE_ROLE_KEY`.
- O webhook Mercado Pago dispara o processador com credencial de service role, compatível com a proteção estrita.
- O processador de fila faz claim atômico por `status` e `attempts`, evitando processamento concorrente por webhook + pg_cron.
- Inserções concorrentes do mesmo pagamento tratam `23505` como idempotência.
- `ecommerce-webhook` recusa criar pedido quando não consegue verificar o pagamento com o token da organização.
- `admin-assinaturas` aceita o sinalizador servidor-side `profiles.is_super_admin`, preservando compatibilidade com a lista histórica de e-mails.
- `PDVPage` usa `cachePecas` estaticamente e estabiliza `addToCarrinho`, eliminando o warning de chunk/import e o warning de dependência do hook.
- Sessões públicas do cliente agora ficam em `sessionStorage`; sessões válidas antigas são migradas uma vez e removidas do `localStorage`, com teste automatizado.
- `criar-codigo-externo` usa comparação em tempo constante para o segredo cross-project.
- Documentação de pendências atualizada com o segredo da fila, a necessidade de rotação e a condição de duplicatas históricas antes dos índices.

## Testes executados

- `npx tsc --noEmit -p tsconfig.app.json`: passou.
- `npm test -- --reporter=dot`: passou — 10 arquivos, 61 testes.
- `npm run lint -- --quiet`: passou sem erros.
- `npm run build`: passou — 5.043 módulos transformados.
- ESLint direcionado nos arquivos modificados: passou sem erros.
- `git diff --check`: passou; apenas avisos normais de conversão LF/CRLF do Git.
- Checks estáticos da migration e do claim da fila: passaram.
- Avisos conhecidos: 718 warnings no lint completo, predominantemente `no-explicit-any`; os testes exibem um stderr intencional de permissão e um warning de `act(...)` no teste do dashboard, sem falha.

## Git, push e deploy

- Commits: `fb998a4` (`fix: harden public config and payment processing`), `930f760` (`docs: record autonomous engineering run`), `78354cc` (`fix: protect public session storage`), `0dad47c` (`docs: update nightly validation results`) e `8b10447` (`docs: finalize production validation record`).
- Push: concluído para `origin/main`; a branch local está alinhada ao remoto em `8b10447`.
- CI: não há workflow detectável no repositório para acompanhar.
- Deploy remoto Supabase/Lovable: não foi executado automaticamente, pois não há CLI/credencial/painel autorizado neste ambiente. O código pode ser sincronizado pelo fluxo existente do repositório, mas a aplicação publicada e as Edge Functions não foram presumidas como atualizadas.
- Health check público: `https://nexsiles2567.lovable.app/?nightly=fb998a4` respondeu HTTP 200 com título `Nexsiles`.
- A página pública ainda referencia `index-D3iIUKA7.js`/`index-DxQ5ZiGz.css`, enquanto o build local deste commit gera `index-BRY17Wwv.js`/`index-IDOT2vUN.css`; portanto o publish da versão deste commit não foi confirmado.

## Bloqueios que dependem de acesso externo

1. Aplicar a migration no projeto Supabase `ljofnwcvpzqlhagejgbk` e confirmar o estado real das policies/índices; migrations aplicadas somente pelo painel precisam ser comparadas.
2. Configurar `MERCADOPAGO_WEBHOOK_SECRET`, `WHATSAPP_WEBHOOK_SECRET` e `CRON_SECRET` nos secrets das Edge Functions.
3. Rotacionar tokens Mercado Pago e a chave Gemini, pois o histórico de policies indica exposição potencial anterior. Isso não foi feito automaticamente para não quebrar pagamentos nem alterar credenciais sem autorização.
4. Confirmar no painel Lovable o publish da branch `main` e executar smoke test autenticado. A verificação automatizada disponível nesta sessão limita-se ao HTTP público; não houve navegador disponível para login/console.
5. Se a migration de índices encontrar duplicatas históricas, identificar e resolver manualmente os registros antes de criar os índices, sem apagar dados automaticamente.

## Próximos passos recomendados

- Aplicar a migration e validar as consultas de auditoria de `pg_policies` e `information_schema.table_privileges` descritas em `docs/PENDENCIAS-painel.md`.
- Reprocessar notificações Mercado Pago pendentes depois de configurar os secrets.
- Criar uma RPC transacional para a venda completa do PDV (venda, itens, caixa e estoque), e cobrir o fluxo com testes de integração.
- Adicionar reconciliação diária de pagamentos aprovados e estados de pedido.
- Expandir estados de erro das páginas e testar as Edge Functions de pagamento com ambiente de homologação.
