import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANOS = {
  nexsiles: {
    nome: "Nexsiles",
    priceId: "price_nexsiles", // Will be created dynamically
    valor: 4990, // in cents
  },
  nexsiles_max: {
    nome: "Nexsiles Max",
    priceId: "price_nexsiles_max",
    valor: 9990, // in cents
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { action, plano, successUrl, cancelUrl } = await req.json();

    console.log(`Processing action: ${action} for user: ${user.id}`);

    if (action === "create-checkout") {
      // Get or create Stripe customer
      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let customerId = assinatura?.stripe_customer_id;

      if (!customerId) {
        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome, email")
          .eq("user_id", user.id)
          .single();

        const customer = await stripe.customers.create({
          email: user.email || profile?.email,
          name: profile?.nome || user.email,
          metadata: {
            user_id: user.id,
          },
        });
        customerId = customer.id;
        console.log(`Created Stripe customer: ${customerId}`);
      }

      // Get or create product and price
      const planoInfo = PLANOS[plano as keyof typeof PLANOS];
      if (!planoInfo) {
        throw new Error("Plano inválido");
      }

      // Find or create product
      const products = await stripe.products.list({
        active: true,
        limit: 100,
      });

      let product = products.data.find((p: Stripe.Product) => p.name === planoInfo.nome);
      
      if (!product) {
        product = await stripe.products.create({
          name: planoInfo.nome,
          description: `Plano ${planoInfo.nome} - Sistema Nexsiles`,
          metadata: {
            plano_id: plano,
          },
        });
        console.log(`Created product: ${product.id}`);
      }

      // Find or create price
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        type: "recurring",
      });

      let price = prices.data.find((p: Stripe.Price) => p.unit_amount === planoInfo.valor);

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: planoInfo.valor,
          currency: "brl",
          recurring: {
            interval: "month",
          },
        });
        console.log(`Created price: ${price.id}`);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card", "boleto"],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl || `${req.headers.get("origin")}/planos?success=true`,
        cancel_url: cancelUrl || `${req.headers.get("origin")}/planos?canceled=true`,
        locale: "pt-BR",
        metadata: {
          user_id: user.id,
          plano: plano,
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            plano: plano,
          },
        },
      });

      console.log(`Created checkout session: ${session.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          sessionId: session.id,
          url: session.url,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "create-portal") {
      // Get customer ID
      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();

      if (!assinatura?.stripe_customer_id) {
        throw new Error("Nenhuma assinatura encontrada");
      }

      // Create portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: assinatura.stripe_customer_id,
        return_url: successUrl || `${req.headers.get("origin")}/planos`,
      });

      console.log(`Created portal session for customer: ${assinatura.stripe_customer_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          url: portalSession.url,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "get-subscription-status") {
      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          assinatura,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    throw new Error("Invalid action");

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
