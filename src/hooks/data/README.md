# Hooks por Feature (refatoração progressiva de `useSupabaseData.ts`)

O arquivo legacy `src/hooks/useSupabaseData.ts` (3.086 linhas, 117 hooks) está sendo
gradualmente quebrado em arquivos por domínio nesta pasta.

## Como migrar um hook

1. Encontre o hook em `useSupabaseData.ts`
2. Mova para o arquivo de domínio correto (ou crie um novo): `usePecas.ts`, `useVendas.ts`, `useClientes.ts`, `useMaletas.ts`, `useRevendedoras.ts`, `useFornecedores.ts`, `useBanhos.ts`, etc.
3. Re-exporte do `useSupabaseData.ts` para manter compatibilidade:
   ```ts
   export { usePecas, useCreatePeca } from './data/usePecas';
   ```
4. Quando todos os consumidores forem atualizados, remova o re-export.

## Regras

- Hooks novos: **sempre** criar aqui em `src/hooks/data/`, **nunca** em `useSupabaseData.ts`
- Tipar com `Database['public']['Tables'][TABLE]['Row']`
- Nunca usar `: any` (memória core)
- Importar `supabase` de `@/integrations/supabase/client` (nunca `@/lib/supabase-db`)
