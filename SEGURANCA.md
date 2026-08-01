# Correções de segurança — APLICADO em 30/07/2026

> **Situação: concluído e verificado em produção.** As quatro migrations foram
> aplicadas, o site foi republicado pelo Lovable e a Edge Function nova está no
> ar. Verificação externa final: 19/19 (a única "falha" registrada era o próprio
> limite de tentativas bloqueando o teste — ou seja, funcionando).
>
> | Antes | Depois |
> |---|---|
> | `purchases` com 18 compradores (16 CPFs) legível por qualquer visitante | 401 Unauthorized |
> | `preco_custo` das peças legível por qualquer visitante | permission denied |
> | 4 funções do portal/loja respondendo sem login | removidas ou bloqueadas |
> | Endpoint que testava senha sem limite de tentativas | desativado |
> | Auto-promoção a admin e a super admin | bloqueadas |
>
> O que continua funcionando, conferido: vitrine da loja, catálogo público,
> maleta compartilhada, login do portal (com limite de 10 tentativas por e-mail
> a cada 10 min), validação de código no cadastro e a tela pós-pagamento.

## Histórico das migrations aplicadas

| Arquivo | O que faz |
|---|---|
| `20260730120000_hardening_sessoes_publicas_rls_privilegios.sql` | Sessão por token no portal e na loja, `purchases` fechada, escalada de privilégio, ~25 policies permissivas, códigos de acesso, estoque atômico |
| `20260730180000_pecas_colunas_publicas.sql` | Visitante enxerga só as colunas de vitrine das peças (não o custo) |
| `20260730190000_session_subject_sem_escrita.sql` | Corrige o erro 25006 (função STABLE não pode escrever) |
| `20260730200000_desativa_oraculo_de_senha.sql` | Remove as funções que sustentavam o endpoint antigo de teste de senha |

---

# Como foi aplicado (referência)

> **Status da verificação.** A migration foi aplicada e testada num Postgres real
> (PGlite, sem Docker) contra um banco montado a partir de `types.ts`: **69
> testes de segurança passando**, incluindo isolamento entre revendedoras e entre
> tenants, escalada de privilégio, rate limit e estoque atômico. Também foram
> cruzadas as **216 operações de tabela** e as **32 RPCs** do app com o conjunto
> final de policies para garantir que nenhuma tela ficou sem acesso. Ver
> `supabase/tests/README.md`. O banco de produção estava fora do ar
> (PostgREST `PGRST002`) durante todo o trabalho, então **nada foi validado
> contra os dados reais**.
>
> Essa validação achou dois bugs na própria correção, já consertados:
> subconsulta em policy também passa por RLS (ia derrubar as telas de equipe), e
> `REVOKE ... FROM anon` não tira o acesso herdado de `PUBLIC`.

Este pacote corrige as falhas encontradas na análise do app. São duas partes que
**precisam ir juntas**: o SQL no banco e o código (frontend + Edge Functions).

O motivo: as funções do portal da revendedora e da área "Meus pedidos" da loja
mudaram de assinatura. Elas recebiam o `id` de quem se dizia dono dos dados
(`p_revendedora_id`, `p_cliente_email`) e confiavam nesse valor; agora recebem um
**token de sessão** emitido pelo banco no login. O código antigo não fala com o
banco novo, e vice-versa.

---

## Ordem de aplicação

### 1. Deploy do código (Lovable / GitHub)

Faça o merge/push normal. Nada aqui quebra o app que está no ar hoje — as telas
novas passam a chamar RPCs que ainda não existem, então **o portal e o "Meus
pedidos" ficam fora do ar entre o passo 1 e o passo 2**. Faça os dois seguidos.

Isso inclui a Edge Function nova `consultar-codigo-pendente` e a reescrita de
`verificar-senha-portal` — no Lovable elas sobem com o deploy; se você usa a CLI:

```sh
supabase functions deploy consultar-codigo-pendente
supabase functions deploy verificar-senha-portal
```

### 2. SQL no banco

Abra o **SQL Editor** do projeto Supabase (`ljofnwcvpzqlhagejgbk`), cole o
conteúdo de:

```
supabase/migrations/20260730120000_hardening_sessoes_publicas_rls_privilegios.sql
```

e execute. O script é idempotente (pode rodar de novo sem estragar nada) e está
todo comentado, seção por seção, explicando o que cada bloco corrige.

> Migrations em arquivo **não** são aplicadas automaticamente pelo Lovable nem
> pelo push no GitHub. Se este passo não for feito, o banco continua exposto.

### 3. Regerar os tipos (opcional, recomendado)

As RPCs novas não estão em `src/integrations/supabase/types.ts` — o código usa o
cliente "loose" (`dbRpc`) justamente para isso, então nada quebra. Quando puder,
peça ao Lovable para regenerar os tipos.

---

## O que muda para quem usa o sistema

| Quem | O que acontece |
|---|---|
| Revendedoras | Precisam entrar de novo no portal. O login agora é e-mail + senha em uma única etapa, e a sessão expira em 12h. |
| Clientes da loja | Precisam entrar de novo em "Minha conta" para ver pedidos. |
| Funcionários | Nada muda no dia a dia. Quem tinha se promovido a admin por conta própria (se houver) perde a promoção — confira a lista de admins depois de aplicar (query no fim deste arquivo). |
| Super admin | A flag `is_super_admin` só pode ser mudada pelo SQL Editor ou por quem já é super admin. |
| Cadastro com código pago | Volta a funcionar (estava quebrado: a tela lia uma tabela que a RLS já não permitia). O código agora só ativa na conta cujo e-mail é o mesmo da compra. |

---

## Conferência depois de aplicar

Rode no SQL Editor:

```sql
-- 1) Sobrou alguma policy permissiva?
SELECT tablename, policyname, cmd, roles
  FROM pg_policies
 WHERE schemaname = 'public'
   AND (qual ILIKE '%true%' OR with_check ILIKE '%true%')
 ORDER BY tablename;

-- 2) Alguma função SECURITY DEFINER ainda executável por anon?
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.prosecdef
   AND has_function_privilege('anon', p.oid, 'EXECUTE')
 ORDER BY 1;

-- 3) Quem é admin / super admin hoje?
SELECT u.email, ur.role, p.is_super_admin
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  LEFT JOIN public.profiles p ON p.user_id = u.id
 ORDER BY p.is_super_admin DESC NULLS LAST, ur.role;

-- 4) Sessões públicas abertas (portal + loja)
SELECT subject_type, count(*), max(last_seen_at)
  FROM public.public_sessions
 WHERE expires_at > now()
 GROUP BY 1;
```

Em (1) e (2) o que deve sobrar é apenas a vitrine pública: leitura de peças/
catálogos/maletas marcadas como públicas, envio de avaliação, "avise-me",
newsletter, e as policies `USING (false)` (que são bloqueios, não brechas).

---

## Ainda pendente (fora do código)

1. **Rotacionar credenciais.** A tabela `purchases` esteve legível publicamente
   (nome, CPF, telefone, e-mail e `access_code` de todos os compradores) e a RPC
   `get_pending_access_code` permitia varrer e-mails. Considere invalidar os
   códigos de acesso ainda não usados e emitir novos:

   ```sql
   -- inspecione antes de rodar
   SELECT codigo, email, valido_ate FROM public.codigos_acesso WHERE usado = false;
   ```

2. **LGPD.** Se houve acesso indevido a CPF, há dever de registro e possível
   comunicação aos titulares. Vale documentar a data em que a exposição foi
   fechada (a data em que você aplicar o passo 2).

3. **Segredos de webhook.** `MERCADOPAGO_WEBHOOK_SECRET` e
   `WHATSAPP_WEBHOOK_SECRET`: se não estiverem configurados, a verificação de
   assinatura é ignorada (`_shared/hmac.ts` retorna `true` quando não há
   segredo). Confirme no painel do Supabase. O mesmo vale para `CRON_SECRET`.

4. **CSP.** Os cabeçalhos foram adicionados em `nginx.conf` e `vercel.json`, mas
   o `Content-Security-Policy` está em modo **Report-Only** de propósito (o app
   carrega SDK do Mercado Pago, GTM e pixel do Facebook em runtime). Depois de
   alguns dias sem violação no console do navegador, troque o nome do cabeçalho
   para `Content-Security-Policy`.

5. **Dependências mortas.** `firebase` e `@anthropic-ai/sdk` estão declarados em
   `package.json` e não são importados em nenhum lugar. Não removi porque os
   lockfiles (`bun.lock`, `bun.lockb`, `package-lock.json`) precisam ser
   regenerados no mesmo commit — se o deploy usar `--frozen-lockfile` / `npm ci`,
   um lockfile fora de sincronia quebra o build. Peça ao Lovable para remover as
   duas dependências, que ele atualiza os lockfiles junto.
