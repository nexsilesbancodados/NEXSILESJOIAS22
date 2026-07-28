// Mercado Pago Webhook — ASSÍNCRONO
// 1. Valida HMAC
// 2. Enfileira em webhook_queue
// 3. Responde 200 em <500ms
// O processamento real acontece em `process-webhook-queue` (cron a cada 1 min)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyMercadoPagoSignature } from "../_shared/hmac.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { createLogger, captureError } from "../_shared/logger.ts";

const log = createLogger("mercadopago-webhook");
const FUNCTION_NAME = "mercadopago-webhook";
const IS_PROD = (Deno.env.get("MERCADOPAGO_ENV") ?? "").toLowerCase() === "production"
  || (Deno.env.get("ENVIRONMENT") ?? "").toLowerCase() === "production";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rl = await rateLimit(req, "mercadopago-webhook", { maxRequests: 600 });
  if (rl) return rl;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();

    // ===== HMAC =====
    const mpSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
    if (mpSecret) {
      const ok = await verifyMercadoPagoSignature(req, rawBody, mpSecret);
      if (!ok) {
        log.warn("Invalid MP signature");
        await captureError({ functionName: FUNCTION_NAME, error: new Error("Invalid MP signature"), statusCode: 401, requestIp: req.headers.get("x-forwarded-for") ?? undefined });
        return new Response("Invalid signature", { status: 401, headers: corsHeaders });
      }
    } else if (IS_PROD) {
      log.error("MERCADOPAGO_WEBHOOK_SECRET missing in production — rejecting");
      await captureError({ functionName: FUNCTION_NAME, error: new Error("MERCADOPAGO_WEBHOOK_SECRET not configured in production"), statusCode: 500 });
      return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
    } else {
      log.warn("MERCADOPAGO_WEBHOOK_SECRET not set — signature check skipped (non-prod)");
    }

    // Capture headers + query params for the processor
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });
    const url = new URL(req.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => { query[k] = v; });

    let parsedBody: unknown = null;
    try { parsedBody = rawBody ? JSON.parse(rawBody) : null; } catch { /* keep raw */ }

    const { error } = await supabase
      .from("webhook_queue")
      .insert({
        source: "mercadopago",
        payload: { body: parsedBody, raw: rawBody, query },
        headers,
        status: "pending",
      });

    if (error) {
      log.error("Failed to enqueue", { error: error.message });
      await captureError({ functionName: FUNCTION_NAME, error, statusCode: 500, requestPayload: { source: "mercadopago" } });
      // Ainda retornamos 200 para o MP não bombardear com retries
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    log.info("Webhook enqueued");

    // Fire-and-forget: dispara o processador imediatamente para não esperar 1 min do cron.
    // Sem await — devolve 200 rápido pro MP não retentar por timeout.
    try {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? supabaseServiceKey;
      fetch(`${supabaseUrl}/functions/v1/process-webhook-queue`, {
        method: "POST",
        headers: { Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
        body: "{}",
      }).catch((e) => log.warn("process-webhook-queue trigger failed", { error: e?.message }));
    } catch (_) { /* no-op */ }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err: any) {
    log.error("Webhook error", { error: err.message });
    await captureError({ functionName: FUNCTION_NAME, error: err, statusCode: 500, requestIp: req.headers.get("x-forwarded-for") ?? undefined });
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
