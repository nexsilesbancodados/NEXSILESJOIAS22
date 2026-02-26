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
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

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

      // Fetch payment details from MP
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
      });

      if (!mpResponse.ok) {
        console.error("Failed to fetch payment from MP:", mpResponse.status);
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      const payment = await mpResponse.json();
      console.log("Payment status:", payment.status, "ID:", payment.id);

      if (payment.status === "approved") {
        // Check if order already exists for this payment
        const { data: existingOrder } = await supabase
          .from("ecommerce_pedidos")
          .select("id")
          .eq("mercadopago_payment_id", String(payment.id))
          .maybeSingle();

        if (existingOrder) {
          console.log("Order already exists for payment:", payment.id);
          // Update status if needed
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

        const {
          organization_id, items, cliente, endereco,
          valor_subtotal, valor_frete, valor_total,
        } = refData;

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
        // Update existing order if any
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
