import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { computeOrderTotals } from "../_shared/pricing.ts";

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
    const { formData, organization_id, items, cliente, endereco, valor_frete, cupom_id } = body;

    if (!formData) throw new Error("formData obrigatório");
    if (!organization_id) throw new Error("organization_id obrigatório");

    // Recalcula preços/totais no servidor — nunca confia nos valores do cliente.
    const totals = await computeOrderTotals({
      organizationId: organization_id,
      items,
      cupomId: cupom_id || null,
      frete: valor_frete,
    });

    // Fetch org-specific MP token, fallback to global
    const { data: ecomConfig } = await supabase
      .from("ecommerce_config")
      .select("mercadopago_access_token")
      .eq("organization_id", organization_id)
      .single();

    const MERCADOPAGO_ACCESS_TOKEN = ecomConfig?.mercadopago_access_token || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) throw new Error("Mercado Pago não configurado");

    // Processa o pagamento — força o valor cobrado ao total calculado no servidor.
    const paymentData = { ...formData, transaction_amount: totals.valor_total, description: `Pedido - Loja Online` };

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
      // Cria o pedido com os totais calculados no servidor.
      const { data: pedido, error: pedidoError } = await supabase
        .from("ecommerce_pedidos")
        .insert({
          organization_id,
          cliente_nome: cliente.nome,
          cliente_email: cliente.email || null,
          cliente_telefone: cliente.telefone || null,
          cliente_cpf: cliente.cpf || null,
          endereco: endereco || null,
          valor_subtotal: totals.valor_subtotal,
          valor_frete: totals.valor_frete,
          valor_desconto: totals.valor_desconto,
          cupom_id: totals.cupom_id,
          valor_total: totals.valor_total,
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

      // Insert order items (preços do servidor)
      if (totals.items.length > 0) {
        const orderItems = totals.items.map((item) => ({
          pedido_id: pedido.id,
          peca_id: item.peca_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
        }));

        const { error: itensError } = await supabase.from("ecommerce_pedido_itens").insert(orderItems);
        if (itensError) console.error("Error inserting items:", itensError);

        // Debit stock atomically
        for (const item of totals.items) {
          const { error: stockError } = await supabase.rpc("debitar_estoque_ecommerce" as any, {
            p_peca_id: item.peca_id,
            p_quantidade: item.quantidade,
          });
          if (stockError) {
            const { data: peca } = await supabase.from("pecas").select("estoque").eq("id", item.peca_id).single();
            if (peca) {
              await supabase.from("pecas").update({ estoque: Math.max(0, (peca.estoque || 0) - item.quantidade) }).eq("id", item.peca_id);
            }
          }
        }
      }

      // Increment coupon usage if applied
      if (totals.cupom_id) {
        await supabase.rpc("usar_cupom", { p_cupom_id: totals.cupom_id });
      }

      // Send confirmation email (fire and forget)
      if (cliente.email) {
        fetch(`${supabaseUrl}/functions/v1/enviar-confirmacao-pedido`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({ pedido_id: pedido.id }),
        }).catch(err => console.error("Email error:", err));
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
