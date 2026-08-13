# Loja virtual: publicação e operação

## Aplicar as migrations

O projeto não tem o CLI do Supabase nem as credenciais remotas no workspace. No ambiente que possui acesso ao projeto, rode:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

As migrations criam `template_id`, modelos personalizados, histórico/undo, campos de SEO/domínio e o bucket privado por organização `lojas`.

Conferência rápida no SQL Editor:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'ecommerce_config'
  and column_name in ('template_id', 'templates_personalizados', 'layout_historico', 'custom_domain', 'seo_title');

select id, name, public
from storage.buckets
where id = 'lojas';
```

## Domínio próprio

1. Cadastre o domínio em Loja Virtual → Links e compartilhamento.
2. No provedor DNS, crie um CNAME para o host publicado pela aplicação.
3. Configure o domínio também no hosting para que ele encaminhe o tráfego para a SPA.
4. Depois da propagação, a aplicação resolve o domínio pelo campo `custom_domain` e abre a vitrine correspondente.

## Checkout

O cliente valida carrinho, estoque e pedido mínimo no navegador, mas o checkout recalcula preço, cupom, frete e estoque no servidor. O Mercado Pago confirma/debita estoque no processamento do pagamento; o PIX direto fica aguardando confirmação para não vender uma peça sem pagamento.
