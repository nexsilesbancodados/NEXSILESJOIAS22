// Processa webhooks enfileirados em `webhook_queue` com retry/backoff.
// Disparado via pg_cron a cada minuto.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("process-webhook-queue");
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 25;

async function sendEmailBrevo(apiKey: string, to: { email: string; name?: string }, from: { email: string; name: string }, subject: string, htmlContent: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { name: from.name, email: from.email }, to: [{ email: to.email, name: to.name || to.email }], subject, htmlContent }),
  });
  if (!res.ok) throw new Error(`Brevo error [${res.status}]: ${await res.text()}`);
  return await res.json();
}

async function processMercadoPago(supabase: any, payload: any, query: Record<string, string>) {
  const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

  const body = payload?.body;
  let paymentId: string | null = null;

  if (body?.type === "payment" || body?.action?.startsWith?.("payment.")) {
    paymentId = body.data?.id ? String(body.data.id) : null;
  }
  if (!paymentId && query.topic === "payment") paymentId = query.id || null;
  if (!paymentId) { log.info("No payment id, skipping"); return; }

  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });
  if (!resp.ok) throw new Error(`MP fetch ${resp.status}`);
  const payment = await resp.json();

  if (payment.status !== "approved") {
    log.info("Payment not approved", { status: payment.status });
    return;
  }

  // Extract subscription data
  let plano: string | undefined;
  let periodo: string | undefined;
  let valor: number | undefined;
  let userEmail: string | undefined;

  if (payment.metadata?.plano) {
    plano = payment.metadata.plano;
    periodo = payment.metadata.periodo;
    valor = payment.metadata.valor;
    userEmail = payment.metadata.email;
  } else {
    try {
      const ext = JSON.parse(payment.external_reference);
      plano = ext.plano; periodo = ext.periodo; valor = ext.valor; userEmail = ext.email;
    } catch {
      const extRef = payment.external_reference || "";
      const m = extRef.match(/^assinatura_([a-f0-9-]+)_(\w+)_(\w+)_/);
      if (m) { plano = m[2]; periodo = m[3]; valor = payment.transaction_amount; userEmail = payment.payer?.email; }
    }
  }

  const payerEmail = userEmail || payment.payer?.email;
  if (!plano || !payerEmail) throw new Error("Missing plano or email");

  // Idempotency
  const { data: existing } = await supabase
    .from("codigos_acesso").select("id").eq("mercadopago_payment_id", String(paymentId)).maybeSingle();
  if (existing) { log.info("Already processed"); return; }

  const { data: codigoData, error: codigoErr } = await supabase.rpc("gerar_codigo_acesso");
  if (codigoErr) throw codigoErr;

  const validoAte = new Date();
  validoAte.setDate(validoAte.getDate() + 30);

  const { error: insErr } = await supabase.from("codigos_acesso").insert({
    codigo: codigoData,
    email: payerEmail,
    plano,
    valor_pago: valor || payment.transaction_amount || 0,
    mercadopago_payment_id: String(paymentId),
    valido_ate: validoAte.toISOString(),
  });
  if (insErr) throw insErr;

  // Email
  const brevoKey = Deno.env.get("BREVO_API_KEY");
  if (brevoKey) {
    const html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><h1>🎉 Pagamento Confirmado!</h1><p>Use o código abaixo para criar sua conta:</p><div style="background:#fef3c7;border:2px dashed #f59e0b;border-radius:8px;padding:20px;text-align:center;margin:20px 0"><div style="font-size:32px;font-weight:bold;color:#92400e;letter-spacing:4px;font-family:monospace">${codigoData}</div><p style="margin-top:10px;color:#666;font-size:12px">Válido por 30 dias</p></div><a href="https://nexsiles2567.lovable.app/auth" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Criar Minha Conta</a></div>`;
    try {
      await sendEmailBrevo(brevoKey, { email: payerEmail }, { email: "contato@nexsiles.com.br", name: "NexSiles" }, "🎉 Seu código de acesso", html);
    } catch (e: any) { log.warn("Email failed", { error: e.message }); }
  }

  log.info("Code generated", { codigo: codigoData, email: payerEmail });
}

serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: items, error } = await supabase
    .from("webhook_queue")
    .select("*")
    .eq("status", "pending")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    log.error("Failed to fetch queue", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!items?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let ok = 0, fail = 0;
  for (const it of items) {
    try {
      // Mark as processing (optimistic — same row, no lock since cron is single instance)
      await supabase.from("webhook_queue").update({ attempts: it.attempts + 1 }).eq("id", it.id);

      if (it.source === "mercadopago") {
        await processMercadoPago(supabase, it.payload, it.payload?.query || {});
      } else {
        log.warn("Unknown source", { source: it.source });
      }

      await supabase.from("webhook_queue").update({ status: "done", processed_at: new Date().toISOString() }).eq("id", it.id);
      ok++;
    } catch (err: any) {
      const newAttempts = it.attempts + 1;
      const finalStatus = newAttempts >= MAX_ATTEMPTS ? "failed" : "pending";
      await supabase.from("webhook_queue").update({ status: finalStatus, last_error: err.message?.slice(0, 500) }).eq("id", it.id);
      log.error("Process failed", { id: it.id, attempts: newAttempts, error: err.message });
      fail++;
    }
  }

  return new Response(JSON.stringify({ processed: ok, failed: fail, total: items.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
