import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Ecommerce webhook received:", JSON.stringify(body));

    // MP sends notifications with type and data.id
    if (body.type === "payment" || body.action === "payment.created" || body.action === "payment.updated") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      // We need to determine the org to get the right token
      // First try to find existing order for this payment
      const { data: existingOrder } = await supabase
        .from("ecommerce_pedidos")
        .select("id, organization_id, status")
        .eq("mercadopago_payment_id", String(paymentId))
        .maybeSingle();

      let mpToken: string | undefined;

      if (existingOrder?.organization_id) {
        // Fetch org token
        const { data: ecomConfig } = await supabase
          .from("ecommerce_config")
          .select("mercadopago_access_token")
          .eq("organization_id", existingOrder.organization_id)
          .single();
        mpToken = ecomConfig?.mercadopago_access_token || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      } else {
        // Try global token first, we'll resolve org from external_reference later
        mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      }

      if (!mpToken) {
        console.error("No MP token available for webhook");
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      // Fetch payment details from MP
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      });

      if (!mpResponse.ok) {
        // If global token failed, try to find org from external_reference via a different approach
        console.error("Failed to fetch payment from MP:", mpResponse.status);
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      const payment = await mpResponse.json();
      console.log("Payment status:", payment.status, "ID:", payment.id);

      if (payment.status === "approved") {
        if (existingOrder) {
          console.log("Order already exists for payment:", payment.id);
          await supabase
            .from("ecommerce_pedidos")
            .update({ status: "pago" })
            .eq("id", existingOrder.id)
            .neq("status", "pago");
          return new Response("ok", { status: 200, headers: corsHeaders });
        }

        // Try to create order from external_reference
        let refData;
        try {
          refData = JSON.parse(payment.external_reference);
        } catch {
          console.log("Could not parse external_reference");
          return new Response("ok", { status: 200, headers: corsHeaders });
        }

        const { organization_id, items, cliente, endereco, valor_subtotal, valor_frete, valor_total } = refData;

        // If we used global token but org has its own, re-fetch payment with org token
        if (organization_id && !existingOrder) {
          const { data: orgConfig } = await supabase
            .from("ecommerce_config")
            .select("mercadopago_access_token")
            .eq("organization_id", organization_id)
            .single();
          
          if (orgConfig?.mercadopago_access_token && orgConfig.mercadopago_access_token !== mpToken) {
            // Re-verify with org-specific token
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
            cliente_nome: cliente.nome,
            cliente_email: cliente.email || null,
            cliente_telefone: cliente.telefone || null,
            cliente_cpf: cliente.cpf || null,
            endereco: endereco || null,
            valor_subtotal: valor_subtotal || 0,
            valor_frete: valor_frete || 0,
            valor_total: valor_total || 0,
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

        // Send confirmation email
        if (cliente.email) {
          fetch(`${supabaseUrl}/functions/v1/enviar-confirmacao-pedido`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ pedido_id: pedido.id }),
          }).catch((err) => console.error("Email error:", err));
        }

        console.log("Webhook order created:", pedido.numero_pedido);
      } else if (payment.status === "cancelled" || payment.status === "rejected") {
        await supabase
          .from("ecommerce_pedidos")
          .update({ status: "cancelado" })
          .eq("mercadopago_payment_id", String(payment.id));
      }
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error in ecommerce-webhook:", error);
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});
