import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CartItem {
  peca_id: string;
  quantidade: number;
  preco_unitario: number;
  nome: string;
  codigo?: string;
  descricao?: string;
  categoria?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  organization_id: string;
  cliente: {
    nome: string;
    email?: string;
    telefone?: string;
    cpf?: string;
  };
  endereco?: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  valor_frete: number;
  metodo_pagamento?: string;
  cupom_id?: string;
  valor_desconto?: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CheckoutRequest = await req.json();
    const { items, organization_id, cliente, endereco, valor_frete, metodo_pagamento, cupom_id, valor_desconto } = body;

    if (!items || items.length === 0) throw new Error("Carrinho vazio");
    if (!organization_id) throw new Error("Organization ID obrigatório");
    if (!cliente?.nome) throw new Error("Nome do cliente obrigatório");

    // Fetch org config
    const { data: ecomConfig } = await supabase
      .from("ecommerce_config")
      .select("mercadopago_access_token, mercadopago_public_key, mp_user_id, commission_fee, slug, nome_loja, parcelamento_max")
      .eq("organization_id", organization_id)
      .single();

    // Validate stock for each item
    const pecaIds = items.map((i) => i.peca_id);
    const { data: pecas, error: pecasError } = await supabase
      .from("pecas")
      .select("id, nome, codigo, preco_venda, estoque, disponivel_loja, ativo, categoria, descricao")
      .in("id", pecaIds);

    if (pecasError) throw new Error("Erro ao validar estoque");

    for (const item of items) {
      const peca = pecas?.find((p: any) => p.id === item.peca_id);
      if (!peca) throw new Error(`Peça não encontrada: ${item.peca_id}`);
      if (!peca.disponivel_loja || !peca.ativo) throw new Error(`Peça indisponível: ${peca.nome}`);
      if (peca.estoque < item.quantidade) throw new Error(`Estoque insuficiente para: ${peca.nome}`);
    }

    // Calculate totals
    const desconto = valor_desconto || 0;
    const valor_subtotal = items.reduce((sum, item) => sum + item.preco_unitario * item.quantidade, 0);
    const valor_total = valor_subtotal - desconto + (valor_frete || 0);

    // ===== PIX DIRETO: Create order immediately =====
    if (metodo_pagamento === 'pix_direto') {
      const { data: pedido, error: pedidoError } = await supabase
        .from("ecommerce_pedidos")
        .insert({
          organization_id,
          cliente_nome: cliente.nome,
          cliente_email: cliente.email || null,
          cliente_telefone: cliente.telefone || null,
          cliente_cpf: cliente.cpf || null,
          endereco: endereco || null,
          valor_subtotal,
          valor_frete: valor_frete || 0,
          valor_desconto: desconto,
          cupom_id: cupom_id || null,
          valor_total,
          status: "aguardando_pix",
          metodo_pagamento: "pix_direto",
        })
        .select("id, numero_pedido")
        .single();

      if (pedidoError) {
        console.error("Error creating PIX order:", pedidoError);
        throw new Error("Erro ao criar pedido");
      }

      // Insert order items
      if (items.length > 0) {
        const orderItems = items.map((item) => ({
          pedido_id: pedido.id,
          peca_id: item.peca_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
        }));
        await supabase.from("ecommerce_pedido_itens").insert(orderItems);
      }

      // Increment coupon usage if applied
      if (cupom_id) {
        await supabase.rpc("usar_cupom", { p_cupom_id: cupom_id });
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
          pedido_id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          metodo: 'pix_direto',
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== MERCADO PAGO: Create preference =====
    const MERCADOPAGO_ACCESS_TOKEN = ecomConfig?.mercadopago_access_token || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("Mercado Pago não configurado. Configure suas credenciais no painel.");
    }

    const origin = req.headers.get("origin") || "https://nexsiles2567.lovable.app";
    const lojaUrl = ecomConfig?.slug ? `${origin}/loja/${ecomConfig.slug}` : origin;

    // Calculate marketplace fee if configured
    const commissionFee = ecomConfig?.commission_fee ? parseFloat(ecomConfig.commission_fee) : 0;
    const marketplaceFee = commissionFee > 0 ? Math.round(valor_total * (commissionFee / 100) * 100) / 100 : 0;

    // Split client name into first/last
    const nameParts = cliente.nome.trim().split(/\s+/);
    const firstName = nameParts[0] || cliente.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Build external_reference as a unique order ID string
    const externalRef = `org_${organization_id}_${Date.now()}`;

    const preferenceData: any = {
      // ===== ITEMS (quantity, unit_price, id, title, description, category_id) =====
      items: items.map((item) => {
        const peca = pecas?.find((p: any) => p.id === item.peca_id);
        return {
          id: peca?.codigo || item.peca_id,
          title: peca?.nome || item.nome,
          description: (peca?.descricao || peca?.nome || item.nome).substring(0, 256),
          category_id: peca?.categoria || "others",
          quantity: item.quantidade,
          currency_id: "BRL",
          unit_price: item.preco_unitario,
        };
      }),

      // ===== PAYER (email obrigatório, nome, sobrenome, telefone, CPF, endereço) =====
      payer: {
        ...(cliente.email && { email: cliente.email }),
        first_name: firstName,
        last_name: lastName,
        ...(cliente.telefone && {
          phone: {
            area_code: cliente.telefone.replace(/\D/g, "").substring(0, 2),
            number: cliente.telefone.replace(/\D/g, "").substring(2),
          },
        }),
        ...(cliente.cpf && {
          identification: {
            type: "CPF",
            number: cliente.cpf.replace(/\D/g, ""),
          },
        }),
        ...(endereco && {
          address: {
            zip_code: endereco.cep.replace(/\D/g, ""),
            street_name: endereco.rua,
            street_number: parseInt(endereco.numero) || 0,
          },
        }),
      },

      // ===== SHIPMENTS (frete) =====
      ...(valor_frete > 0 && {
        shipments: { cost: valor_frete, mode: "not_specified" },
      }),

      // ===== BACK URLS =====
      back_urls: {
        success: `${lojaUrl}?pagamento=sucesso&ref=${externalRef}`,
        failure: `${lojaUrl}?pagamento=erro`,
        pending: `${lojaUrl}?pagamento=pendente&ref=${externalRef}`,
      },
      auto_return: "approved",

      // ===== EXTERNAL REFERENCE (conciliação financeira - obrigatório) =====
      external_reference: externalRef,

      // ===== NOTIFICATION URL (webhook - obrigatório) =====
      notification_url: `${supabaseUrl}/functions/v1/ecommerce-webhook?source_news=webhooks`,

      // ===== STATEMENT DESCRIPTOR (fatura do cartão) =====
      statement_descriptor: (ecomConfig?.nome_loja || "LOJA ONLINE").substring(0, 22).replace(/[^a-zA-Z0-9 ]/g, ""),

      // ===== BINARY MODE (aprovação instantânea) =====
      binary_mode: false,

      // ===== INSTALLMENTS (parcelas) =====
      payment_methods: {
        installments: ecomConfig?.parcelamento_max || 12,
      },

      // ===== METADATA (dados internos para o webhook) =====
      metadata: {
        organization_id,
        items: items.map(i => ({ peca_id: i.peca_id, quantidade: i.quantidade, preco_unitario: i.preco_unitario })),
        cliente,
        endereco: endereco || null,
        valor_subtotal,
        valor_frete: valor_frete || 0,
        valor_desconto: desconto,
        cupom_id: cupom_id || null,
        valor_total,
      },
    };

    // Add marketplace fee for split payment (only when using OAuth/marketplace token)
    if (marketplaceFee > 0 && ecomConfig?.mp_user_id) {
      preferenceData.marketplace_fee = marketplaceFee;
    }

    console.log("Creating e-commerce preference with full data:", JSON.stringify(preferenceData, null, 2));

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error("MP error:", errorData);
      throw new Error(`Erro ao criar preferência MP`);
    }

    const preference = await mpResponse.json();
    console.log("E-commerce preference created:", preference.id);

    return new Response(
      JSON.stringify({
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        valor_total,
        external_reference: externalRef,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in ecommerce-checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
