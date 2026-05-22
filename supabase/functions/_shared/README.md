# `_shared/` — Edge Functions utilities

Helpers consumidos por todas as Edge Functions. Importe com caminho relativo:

```ts
import { corsHeaders, handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import {
  verifyMercadoPagoSignature,
  verifyStripeSignature,
  verifyHmacSha256,
} from "../_shared/hmac.ts";
import { parseJson, z } from "../_shared/validate.ts";
import { createLogger } from "../_shared/logger.ts";
```

## Convenções

- **CORS**: sempre `handleOptions(req)` antes de qualquer lógica + `jsonResponse()` em todos retornos (sucesso e erro).
- **Rate limit**: chame `rateLimit(req, "function-name")` no topo de funções públicas.
- **Webhook HMAC**: SEMPRE valide antes de processar (`MERCADOPAGO_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `WHATSAPP_WEBHOOK_SECRET`).
- **Validação**: `parseJson(req, ZodSchema)` retorna `{ data }` ou `{ error: Response }`.
- **Logs**: `createLogger("scope")` produz JSON estruturado (parseável em ferramentas de observabilidade).
