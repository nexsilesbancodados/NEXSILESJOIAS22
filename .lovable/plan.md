

## Plano: E-commerce Completo com Pagamento via Mercado Pago

### Contexto
Hoje o catálogo público (`/catalogo/:slug`) apenas gera pedidos sem pagamento online. O objetivo é criar uma **loja virtual pública** (`/loja/:slug`) que exibe as peças do estoque do admin com checkout transparente do Mercado Pago (cartão, PIX, boleto) integrado.

### Arquitetura

```text
┌─────────────────────────────────────────────────┐
│  Admin (autenticado)                            │
│  /configuracoes → Ativa loja, configura slug,   │
│                   logo, cores, frete, etc.       │
│  /pecas → Marca peças como "disponível na loja" │
│  /pedidos-loja → Gerencia pedidos pagos         │
└──────────────────────┬──────────────────────────┘
                       │ organization_id
┌──────────────────────▼──────────────────────────┐
│  Loja Pública (/loja/:slug) - SEM login         │
│  1. Vitrine: grid de peças com filtros          │
│  2. Carrinho lateral                            │
│  3. Checkout transparente (MP Payment Brick)    │
│  4. Confirmação do pedido                       │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  Edge Functions                                 │
│  ecommerce-checkout → Cria preference MP        │
│  ecommerce-process-payment → Processa pagamento │
│    → Cria pedido + itens no DB                  │
│    → Debita estoque                             │
│    → Cria romaneio                              │
└─────────────────────────────────────────────────┘
```

### Etapas de Implementação

#### 1. Banco de Dados (Migrations)

- **Tabela `ecommerce_config`**: `id, organization_id, slug (unique), nome_loja, logo_url, cor_primaria, cor_secundaria, descricao, ativo, frete_gratis_acima, taxa_entrega, created_at, updated_at`
- **Coluna `disponivel_loja` na tabela `pecas`**: boolean default false - marca quais peças aparecem na loja
- **Tabela `ecommerce_pedidos`**: `id, organization_id, numero_pedido (serial), cliente_nome, cliente_email, cliente_telefone, cliente_cpf, endereco (jsonb), valor_subtotal, valor_frete, valor_total, status (pendente/pago/enviado/entregue/cancelado), mercadopago_payment_id, metodo_pagamento, created_at, updated_at`
- **Tabela `ecommerce_pedido_itens`**: `id, pedido_id, peca_id, quantidade, preco_unitario, created_at`
- **Secure View `ecommerce_config_public`**: expõe apenas campos não-sensíveis para acesso anônimo
- **Secure View `pecas_loja_public`**: expõe peças com `disponivel_loja = true` e `estoque > 0` e `ativo = true`, sem preço de custo
- **RLS Policies**: config e pedidos protegidos por organization_id; views públicas para acesso anônimo

#### 2. Edge Functions

- **`ecommerce-checkout`** (verify_jwt = false): Recebe items do carrinho + dados do cliente, valida estoque, cria preference MP com valor total, retorna preferenceId
- **`ecommerce-process-payment`** (verify_jwt = false): Recebe formData do Payment Brick, processa pagamento via MP API, se aprovado: insere pedido + itens, debita estoque das peças, cria romaneio automaticamente

#### 3. Frontend - Loja Pública

- **`/loja/:slug`** (`LojaPublicaPage.tsx`): Página pública completa
  - Header com logo/nome da loja
  - Grid de produtos com imagem, nome, preço, badge "Esgotado"
  - Filtros por categoria e material, busca por nome
  - Carrinho lateral (Sheet) com resumo
  - Modal de checkout com dados do cliente + endereço + CEP auto-fill
  - Integração com Payment Brick do MP (reutiliza padrão do `MercadoPagoCheckout` existente, adaptado para e-commerce)
  - Tela de confirmação com número do pedido

#### 4. Frontend - Painel Admin

- **Config da Loja** (em `/configuracoes`): Aba nova para configurar nome, slug, logo, cores, taxa de entrega, ativar/desativar loja
- **Toggle "Disponível na Loja"** na página de peças: Switch para marcar peças individuais
- **Página de Pedidos da Loja** (`/pedidos-loja`): Lista de pedidos com status, filtros, detalhes, atualização de status (pago → enviado → entregue)

#### 5. Rota e Navegação

- Rota pública: `/loja/:slug` no App.tsx
- Menu admin: novo item "Loja Virtual" no Sidebar com sub-itens (Configurar, Pedidos)

### Detalhes Técnicos

- O checkout é **público** (sem login do comprador), semelhante ao catálogo atual
- O Payment Brick do MP renderiza cartão, PIX e boleto inline
- O estoque é debitado atomicamente na Edge Function após pagamento aprovado
- O `ecommerce-process-payment` usa `service_role_key` para inserir dados sem RLS
- Slug único por organização para URL amigável (ex: `/loja/beneloah-semijoias`)

