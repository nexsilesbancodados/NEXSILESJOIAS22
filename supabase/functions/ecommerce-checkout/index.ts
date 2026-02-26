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
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CheckoutRequest = await req.json();
    const { items, organization_id, cliente, endereco, valor_frete } = body;

    if (!items || items.length === 0) {
      throw new Error("Carrinho vazio");
    }
    if (!organization_id) {
      throw new Error("Organization ID obrigatório");
    }
    if (!cliente?.nome) {
      throw new Error("Nome do cliente obrigatório");
    }

    // Validate stock for each item
    const pecaIds = items.map((i) => i.peca_id);
    const { data: pecas, error: pecasError } = await supabase
      .from("pecas")
      .select("id, nome, preco_venda, estoque, disponivel_loja, ativo")
      .in("id", pecaIds);

    if (pecasError) throw new Error("Erro ao validar estoque");

    for (const item of items) {
      const peca = pecas?.find((p: any) => p.id === item.peca_id);
      if (!peca) throw new Error(`Peça não encontrada: ${item.peca_id}`);
      if (!peca.disponivel_loja || !peca.ativo) throw new Error(`Peça indisponível: ${peca.nome}`);
      if (peca.estoque < item.quantidade) throw new Error(`Estoque insuficiente para: ${peca.nome}`);
    }

    // Calculate totals
    const valor_subtotal = items.reduce((sum, item) => sum + item.preco_unitario * item.quantidade, 0);
    const valor_total = valor_subtotal + (valor_frete || 0);

    // Get store config for back_urls
    const { data: storeConfig } = await supabase
      .from("ecommerce_config")
      .select("slug, nome_loja")
      .eq("organization_id", organization_id)
      .single();

    const origin = req.headers.get("origin") || "https://nexsiles2567.lovable.app";
    const lojaUrl = storeConfig?.slug ? `${origin}/loja/${storeConfig.slug}` : origin;

    // Create MP preference
    const preferenceData = {
      items: items.map((item) => ({
        title: item.nome,
        quantity: item.quantidade,
        currency_id: "BRL",
        unit_price: item.preco_unitario,
      })),
      ...(valor_frete > 0 && {
        shipments: {
          cost: valor_frete,
          mode: "not_specified",
        },
      }),
      payer: {
        email: cliente.email || undefined,
        name: cliente.nome,
      },
      back_urls: {
        success: `${lojaUrl}?pagamento=sucesso`,
        failure: `${lojaUrl}?pagamento=erro`,
        pending: `${lojaUrl}?pagamento=pendente`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        organization_id,
        items,
        cliente,
        endereco,
        valor_subtotal,
        valor_frete: valor_frete || 0,
        valor_total,
      }),
      notification_url: `${supabaseUrl}/functions/v1/ecommerce-webhook`,
      statement_descriptor: storeConfig?.nome_loja?.substring(0, 22) || "LOJA ONLINE",
    };

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
