# O que resolver no painel — passo a passo

Três coisas dependem de configuração no painel (não dá para fazer por SQL). A primeira é
urgente e está custando dinheiro; as outras duas são de risco.

---

## 1. URGENTE — os webhooks estão rejeitando tudo

**O que descobri.** Testei os três webhooks de fora, sem assinatura. Os três recusaram por
falta de segredo configurado:

| Webhook | Resposta | O que está parado |
|---|---|---|
| `mercadopago-webhook` | 500 "Server misconfigured" | confirmação de pagamento de **plano** |
| `ecommerce-webhook` | 500 "Server misconfigured" | confirmação de pagamento de **pedido da loja** |
| `webhook-whatsapp` | 503 "Webhook secret not configured" | **agente de IA não recebe mensagem** |

O processador interno `process-webhook-queue` também exige `CRON_SECRET` para
chamadas do agendador. O webhook de Mercado Pago o chama internamente com
`SUPABASE_SERVICE_ROLE_KEY`; o job do `pg_cron` usa o segredo salvo no Vault pela
migration `20260812190000_cron_com_segredo.sql`. Sem `CRON_SECRET`, a fila fica
parada com resposta 503 até o segredo ser configurado.

O hardening também remove o acesso anônimo às tabelas-base de configurações,
mantendo somente as views públicas e suas colunas seguras. Depois de aplicar a
migration `20260813000000_hardening_agent_config_and_webhook_queue.sql`, trate os
tokens Mercado Pago existentes e a chave Gemini como potencialmente expostos e
faça a rotação no painel dos provedores. A migration cria ainda índices únicos
para impedir o processamento duplicado de pagamentos; se o banco já tiver
duplicatas históricas, a criação do índice deve ser tratada antes da aplicação.

Do lado da segurança está certo: sem o segredo, o sistema recusa em vez de aceitar
qualquer um. O problema é que **o segredo nunca foi configurado** — então nenhuma
confirmação de pagamento chega.

Na prática: pagamento em **PIX ou boleto** (que confirma depois, por webhook) deixa o
pedido parado como "aguardando" e, na venda de plano, o código de acesso não é gerado.
Pagamento com cartão pela tela da loja continua funcionando, porque é processado na hora.

### 1a. Mercado Pago

**Pegar o segredo:**
1. Entre em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) →
   **Suas integrações** → sua aplicação
2. Menu **Webhooks** → **Configurar notificações**
3. Confira se a URL está apontando para:
   `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/mercadopago-webhook`
   (e, para a loja, `.../ecommerce-webhook`)
4. Na mesma tela existe a **"Assinatura secreta"** (*secret key*) — copie. Se não houver,
   clique para gerar.

**Guardar no Supabase:**
1. Painel do Supabase → engrenagem **Project Settings** (canto inferior esquerdo)
2. **Edge Functions** → aba **Secrets** (em alguns painéis: **Configuration → Secrets**)
3. **Add new secret**:
   - Nome: `MERCADOPAGO_WEBHOOK_SECRET`
   - Valor: a assinatura secreta que você copiou
4. Salvar

Serve para os dois webhooks (plano e loja) — é o mesmo segredo.

### 1b. WhatsApp (Evolution API)

Aqui o segredo é você que inventa; ele só precisa ser o mesmo nos dois lados.

1. Escolha uma senha longa e aleatória (pode usar um gerador; 32 caracteres)
2. No Supabase, mesmo lugar do item anterior → **Add new secret**:
   - Nome: `WHATSAPP_WEBHOOK_SECRET`
   - Valor: a senha que você gerou
3. No painel da Evolution API, na configuração do webhook da instância, adicione um
   **cabeçalho (header)**:
   - Nome: `x-webhook-token`
   - Valor: a mesma senha

> Precisei ajustar o código para aceitar esse cabeçalho: a Evolution não sabe assinar o
> corpo da mensagem (HMAC), que era a única forma aceita antes. Por isso o webhook ficaria
> rejeitado para sempre, por mais que o segredo fosse configurado. A mudança está no
> commit e **precisa ser publicada** — peça ao Lovable:
>
> > Publique a Edge Function `webhook-whatsapp`, que foi atualizada.

### 1c. Conferir depois

Me avise que eu testo de fora. O resultado esperado muda de 500/503 para **401** — ou seja,
"recebi, mas essa chamada não tem assinatura válida", que é o comportamento correto para
quem tenta chamar sem ser o Mercado Pago ou a Evolution.

E vale conferir no Mercado Pago se há **notificações pendentes/reenviáveis** dos últimos
dias: pagamentos que não confirmaram por causa disso podem ser reprocessados por lá.

---

## 2. Backups — o projeto não tem nenhum

O painel mostra **"No backups"**. Se o banco for corrompido ou apagado hoje, não há de onde
restaurar. Isso é independente de segurança — é continuidade do negócio, com 19 lojas
cadastradas.

Duas opções:

**Opção A (recomendada) — plano pago do Supabase.** No plano Pro, o Supabase passa a fazer
backup diário automático com 7 dias de retenção. É a solução que não depende de você
lembrar de nada. Painel → **Settings → Billing** → mudar de plano.

**Opção B — exportação manual periódica.** Painel → **Database → Backups** (se disponível
no seu plano) ou exportação por CSV nas telas de cada tabela. Funciona, mas é manual e
sujeito a esquecimento.

---

## 3. Cabeçalhos de segurança do site

Conferi o que o site publicado envia hoje:

| Cabeçalho | Situação |
|---|---|
| `Strict-Transport-Security` | ✅ o Lovable já envia |
| `Referrer-Policy` | ✅ o Lovable já envia |
| `X-Content-Type-Options` | ✅ o Lovable já envia |
| `Content-Security-Policy` | ❌ ausente |
| `X-Frame-Options` | ❌ ausente (permite que o site seja embutido em iframe por terceiros) |

Os arquivos `nginx.conf` e `vercel.json` que preparei **não têm efeito enquanto o site
estiver hospedado no Lovable** — eles só valem se você publicar o app no seu próprio
servidor (Docker/EasyPanel) ou na Vercel. O Lovable não permite configurar cabeçalhos.

Ou seja: não há o que "ligar" agora. Quando/se migrar a hospedagem para o seu domínio
próprio, os arquivos já estão prontos e é só trocar
`Content-Security-Policy-Report-Only` por `Content-Security-Policy` depois de alguns dias
sem erro no console do navegador.

O risco residual hoje é **clickjacking** (alguém embutir seu site num iframe e enganar o
usuário) — baixo para um sistema de gestão com login, mas é o motivo de o cabeçalho existir.
