

## Diagnóstico Atual

Hoje, **todas as lojas** usam um único `MERCADOPAGO_ACCESS_TOKEN` (secret global). Isso significa que todo pagamento da loja virtual de qualquer cliente cai na **sua conta** do Mercado Pago — não na conta de cada lojista.

Para vender o app como SaaS onde **cada cliente recebe seu próprio pagamento**, existem 2 abordagens viáveis:

---

## Opção A: Mercado Pago Marketplace (Split Payment)

Você se registra como **Marketplace no Mercado Pago**. Cada lojista conecta sua conta MP via OAuth. O pagamento vai direto para o vendedor, e você pode reter uma comissão (fee).

**Prós:** Solução oficial, split automático, compliance.
**Contras:** Exige aprovação do MP como Marketplace, fluxo OAuth mais complexo.

## Opção B: Access Token por Organização (Recomendada para MVP)

Cada lojista cadastra seu próprio `access_token` do Mercado Pago no painel de configurações. As Edge Functions buscam o token da organização no banco antes de processar pagamentos.

**Prós:** Simples, rápido de implementar, cada um recebe na sua conta.
**Contras:** Cada cliente precisa criar conta MP e gerar token manualmente.

---

## Plano de Implementação (Opção B — MVP)

### 1. Banco de Dados
- Adicionar coluna `mercadopago_access_token` (text, encrypted) e `mercadopago_public_key` (text) na tabela `ecommerce_config`.
- RLS restrito: apenas owner/admin da organização pode ler/escrever o token.

### 2. Painel Admin (EcommerceConfigTab)
- Nova seção "Integração de Pagamento" na aba Vendas.
- Campos: Access Token (mascarado) e Public Key.
- Link para tutorial de como obter as credenciais no MP.
- Indicador visual de status: "Configurado" / "Pendente".

### 3. Edge Functions (6 funções)
Alterar `ecommerce-checkout`, `ecommerce-process-payment`, `ecommerce-webhook` para:
- Receber `organization_id` no request.
- Buscar `mercadopago_access_token` da tabela `ecommerce_config` via service role.
- Usar o token da organização em vez do secret global.
- Fallback: se não houver token por org, usar o global (para assinaturas do SaaS).

As funções `mercadopago-checkout`, `mercadopago-process-payment`, `mercadopago-webhook` continuam com o token global (são para **assinaturas do próprio SaaS**).

### 4. Loja Pública (LojaPublicaPage)
- Carregar `mercadopago_public_key` da config da organização para inicializar o Brick.
- Substituir a constante `MP_Public_KEY` hard-coded pela key dinâmica.

### 5. Segurança
- Criptografar/mascarar o access_token no banco (exibir apenas últimos 4 chars no painel).
- View pública **não** expõe o access_token (apenas public_key).

---

### Resumo da Separação

```text
┌─────────────────────────────┐     ┌──────────────────────────────┐
│  ASSINATURAS DO SAAS        │     │  LOJA VIRTUAL (POR CLIENTE)  │
│  mercadopago-checkout       │     │  ecommerce-checkout          │
│  mercadopago-process-payment│     │  ecommerce-process-payment   │
│  mercadopago-webhook        │     │  ecommerce-webhook           │
│                             │     │                              │
│  Token: SECRET GLOBAL (seu) │     │  Token: POR ORGANIZAÇÃO      │
│  Pagamento vai pra VOCÊ     │     │  Pagamento vai pro CLIENTE   │
└─────────────────────────────┘     └──────────────────────────────┘
```

Essa arquitetura permite que você cobre a assinatura do SaaS na sua conta, enquanto cada lojista recebe os pagamentos dos seus clientes diretamente na conta MP deles.

