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
    const { formData, organization_id, items, cliente, endereco, valor_subtotal, valor_frete } = body;

    if (!formData) throw new Error("formData obrigatório");

    // Process payment via MP API
    const paymentData = {
      ...formData,
      description: `Pedido - Loja Online`,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await mpResponse.json();
    console.log("Payment result:", paymentResult.status, paymentResult.id);

    if (paymentResult.status === "approved") {
      // Create order
      const valor_total = (valor_subtotal || 0) + (valor_frete || 0);
      
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
          valor_total,
          status: "pago",
          mercadopago_payment_id: String(paymentResult.id),
          metodo_pagamento: paymentResult.payment_method_id || "unknown",
        })
        .select("id, numero_pedido")
        .single();

      if (pedidoError) {
        console.error("Error creating order:", pedidoError);
        throw new Error("Erro ao criar pedido");
      }

      // Insert order items
      if (items && items.length > 0) {
        const orderItems = items.map((item: any) => ({
          pedido_id: pedido.id,
          peca_id: item.peca_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
        }));

        const { error: itensError } = await supabase
          .from("ecommerce_pedido_itens")
          .insert(orderItems);

        if (itensError) console.error("Error inserting items:", itensError);

        // Debit stock atomically
        for (const item of items) {
          const { error: stockError } = await supabase.rpc("debitar_estoque_ecommerce" as any, {
            p_peca_id: item.peca_id,
            p_quantidade: item.quantidade,
          });

          if (stockError) {
            // Fallback: direct update
            const { data: peca } = await supabase
              .from("pecas")
              .select("estoque")
              .eq("id", item.peca_id)
              .single();

            if (peca) {
              await supabase
                .from("pecas")
                .update({ estoque: Math.max(0, (peca.estoque || 0) - item.quantidade) })
                .eq("id", item.peca_id);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          status: "approved",
          payment_id: paymentResult.id,
          numero_pedido: pedido.numero_pedido,
          pedido_id: pedido.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Not approved
    return new Response(
      JSON.stringify({
        status: paymentResult.status,
        status_detail: paymentResult.status_detail,
        payment_id: paymentResult.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in ecommerce-process-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
