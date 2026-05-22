import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyMercadoPagoSignature } from "../_shared/hmac.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("ecommerce-webhook");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rl = await rateLimit(req, "ecommerce-webhook", { maxRequests: 300 });
  if (rl) return rl;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();

    // ===== HMAC SIGNATURE VERIFICATION =====
    const mpSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
    if (mpSecret) {
      const ok = await verifyMercadoPagoSignature(req, rawBody, mpSecret);
      if (!ok) {
        log.warn("Invalid MP webhook signature");
        return new Response("Invalid signature", { status: 401, headers: corsHeaders });
      }
    } else {
      log.warn("MERCADOPAGO_WEBHOOK_SECRET not set — signature check skipped");
    }

    const url = new URL(req.url);
    let paymentId: string | null = null;
    let eventAction: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json") && rawBody) {
      const body = JSON.parse(rawBody);
      log.info("Ecommerce webhook (JSON)", { type: body.type, action: body.action });

      if (body.type === "payment" || body.action === "payment.created" || body.action === "payment.updated") {
        paymentId = body.data?.id ? String(body.data.id) : null;
        eventAction = body.action || body.type;
      } else {
        log.info("Ignoring non-payment event", { type: body.type });
        return new Response("ok", { status: 200, headers: corsHeaders });
      }
    } else {
      const topic = url.searchParams.get("topic") || url.searchParams.get("type");
      const id = url.searchParams.get("id") || url.searchParams.get("data.id");
      log.info("Ecommerce webhook (IPN)", { topic, id });

      if (topic === "payment" && id) {
        paymentId = id;
        eventAction = "payment.ipn";
      } else {
        try {
          const body = rawBody ? JSON.parse(rawBody) : {};
          if (body.type === "payment" || body.action?.startsWith("payment.")) {
            paymentId = body.data?.id ? String(body.data.id) : null;
            eventAction = body.action || body.type;
          }
        } catch {
          log.info("No parseable body", { topic });
        }
        if (!paymentId) {
          return new Response("ok", { status: 200, headers: corsHeaders });
        }
      }
    }

    if (!paymentId) {
      console.log("No payment ID found in webhook");
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    console.log("Processing ecommerce payment ID:", paymentId, "action:", eventAction);

    // Check if order already exists for this payment (idempotency)
    const { data: existingOrder } = await supabase
      .from("ecommerce_pedidos")
      .select("id, organization_id, status")
      .eq("mercadopago_payment_id", String(paymentId))
      .maybeSingle();

    // Determine which MP token to use
    let mpToken: string | undefined;

    if (existingOrder?.organization_id) {
      const { data: ecomConfig } = await supabase
        .from("ecommerce_config")
        .select("mercadopago_access_token")
        .eq("organization_id", existingOrder.organization_id)
        .single();
      mpToken = ecomConfig?.mercadopago_access_token || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    } else {
      mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    }

    if (!mpToken) {
      console.error("No MP token available for webhook");
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // Fetch payment details from Mercado Pago API
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });

    if (!mpResponse.ok) {
      console.error("Failed to fetch payment from MP:", mpResponse.status);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const payment = await mpResponse.json();
    console.log("Payment status:", payment.status, "ID:", payment.id, "external_reference:", payment.external_reference);

    if (payment.status === "approved") {
      if (existingOrder) {
        console.log("Order already exists for payment:", payment.id, "- updating status");
        await supabase
          .from("ecommerce_pedidos")
          .update({ status: "pago" })
          .eq("id", existingOrder.id)
          .neq("status", "pago");
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      // Extract order data from metadata (new format) or external_reference (legacy)
      let orderData: any = null;

      if (payment.metadata && payment.metadata.organization_id) {
        orderData = payment.metadata;
        console.log("Using metadata for order data");
      } else {
        try {
          const parsed = JSON.parse(payment.external_reference);
          if (parsed.organization_id) {
            orderData = parsed;
            console.log("Using legacy external_reference JSON for order data");
          }
        } catch {
          const extRef = payment.external_reference || "";
          const orgMatch = extRef.match(/^org_([a-f0-9-]+)_/);
          if (orgMatch) {
            console.log("external_reference is new format, but no metadata. Skipping order creation.");
          } else {
            console.log("Could not parse external_reference and no metadata");
          }
          return new Response("ok", { status: 200, headers: corsHeaders });
        }
      }

      if (!orderData) {
        console.log("No order data found");
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      const { organization_id, items, cliente, endereco, valor_subtotal, valor_frete, valor_total, cupom_id, valor_desconto } = orderData;

      // Re-verify with org-specific token if needed
      if (organization_id && !existingOrder) {
        const { data: orgConfig } = await supabase
          .from("ecommerce_config")
          .select("mercadopago_access_token")
          .eq("organization_id", organization_id)
          .single();

        if (orgConfig?.mercadopago_access_token && orgConfig.mercadopago_access_token !== mpToken) {
          const orgMpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${orgConfig.mercadopago_access_token}` },
          });
          if (orgMpResponse.ok) {
            const orgPayment = await orgMpResponse.json();
            if (orgPayment.status !== "approved") {
              console.log("Payment not approved with org token");
              return new Response("ok", { status: 200, headers: corsHeaders });
            }
          }
        }
      }

      // Create order
      const { data: pedido, error: pedidoError } = await supabase
        .from("ecommerce_pedidos")
        .insert({
          organization_id,
          cliente_nome: cliente?.nome || payment.payer?.first_name || "Cliente",
          cliente_email: cliente?.email || payment.payer?.email || null,
          cliente_telefone: cliente?.telefone || null,
          cliente_cpf: cliente?.cpf || null,
          endereco: endereco || null,
          valor_subtotal: valor_subtotal || payment.transaction_amount || 0,
          valor_frete: valor_frete || 0,
          valor_desconto: valor_desconto || 0,
          cupom_id: cupom_id || null,
          valor_total: valor_total || payment.transaction_amount || 0,
          status: "pago",
          mercadopago_payment_id: String(payment.id),
          metodo_pagamento: payment.payment_method_id || "unknown",
        })
        .select("id, numero_pedido")
        .single();

      if (pedidoError) {
        console.error("Error creating order:", pedidoError);
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      // Insert items and debit stock
      if (items && items.length > 0) {
        const orderItems = items.map((item: any) => ({
          pedido_id: pedido.id,
          peca_id: item.peca_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
        }));

        await supabase.from("ecommerce_pedido_itens").insert(orderItems);

        for (const item of items) {
          await supabase.rpc("debitar_estoque_ecommerce", {
            p_peca_id: item.peca_id,
            p_quantidade: item.quantidade,
          });
        }
      }

      // Increment coupon usage
      if (cupom_id) {
        await supabase.rpc("usar_cupom", { p_cupom_id: cupom_id });
      }

      // Send confirmation email (fire-and-forget)
      const clienteEmail = cliente?.email || payment.payer?.email;
      if (clienteEmail) {
        fetch(`${supabaseUrl}/functions/v1/enviar-confirmacao-pedido`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({ pedido_id: pedido.id }),
        }).catch((err) => console.error("Email error:", err));
      }

      console.log("Webhook order created:", pedido.numero_pedido);
    } else if (payment.status === "cancelled" || payment.status === "rejected") {
      if (existingOrder) {
        await supabase
          .from("ecommerce_pedidos")
          .update({ status: "cancelado" })
          .eq("id", existingOrder.id);
      }
    } else if (payment.status === "pending" || payment.status === "in_process") {
      console.log("Payment pending/in_process - waiting for final status");
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error in ecommerce-webhook:", error);
    // Always return 200 to prevent MP from retrying on our errors
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});
