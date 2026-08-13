/**
 * Configuração da aplicação, em um lugar só.
 *
 * Antes, cada arquivo resolvia isso do seu jeito: alguns liam `import.meta.env`
 * com fallback, outros sem fallback, outros tinham a URL escrita no meio de um
 * `fetch`. Como `integrations/supabase/client.ts` ignora as variáveis e usa
 * valores fixos, ninguém percebia quando uma variável não estava definida — até
 * o `LGPDPanel` publicar em produção uma chamada para
 * `undefined/functions/v1/export-user-data`.
 *
 * Regra daqui em diante: nada de `import.meta.env` espalhado pelo código. Se
 * precisar de um valor de ambiente, ele entra aqui com um padrão que funciona.
 *
 * Os valores abaixo são todos públicos por natureza — a chave anônima do
 * Supabase e a chave *pública* do Mercado Pago são feitas para rodar no
 * navegador. O que protege os dados é o RLS, não o segredo da chave.
 */

/** URL do projeto Supabase. */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ljofnwcvpzqlhagejgbk.supabase.co';

/** Chave anônima do Supabase (pública; o acesso é controlado por RLS). */
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb2Zud2N2cHpxbGhhZ2VqZ2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjIwMDAsImV4cCI6MjA4NDgzODAwMH0.kCxv9nbZ7eph4T09WYgbUednAQeW0Slutet08G9svXc';

/**
 * Chave pública do Mercado Pago da plataforma — usada no checkout da
 * assinatura, que é cobrada na conta da Nexsiles.
 *
 * Não confundir com a chave de cada loja: a venda da loja usa
 * `loja.mercadopago_public_key`, que o lojista conecta pelo painel.
 */
export const MP_PUBLIC_KEY =
  import.meta.env.VITE_MP_PUBLIC_KEY || 'APP_USR-080297dc-b2f8-4e1b-9a31-d445004700dc';

/** Monta a URL de uma Edge Function. */
export function functionUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}
