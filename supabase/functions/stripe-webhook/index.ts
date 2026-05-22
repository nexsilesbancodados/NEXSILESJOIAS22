import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
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

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // If we have a webhook secret, verify the signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Webhook signature verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Production hardening: refuse unsigned webhooks when secret is not configured
      console.error("❌ STRIPE_WEBHOOK_SECRET not configured — rejecting webhook");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured on server" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plano = session.metadata?.plano;

        if (!userId || !plano) {
          console.error("Missing metadata in checkout session");
          break;
        }

        // Calculate subscription dates (30 days from now)
        const dataInicio = new Date();
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + 30);

        const valorMensal = plano === "nexsiles_max" ? 99.90 : 49.90;

        // Upsert subscription
        const { error: upsertError } = await supabase
          .from("assinaturas")
          .upsert({
            user_id: userId,
            plano: plano,
            status: "ativo",
            data_inicio: dataInicio.toISOString(),
            data_vencimento: dataVencimento.toISOString(),
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            valor_mensal: valorMensal,
            notificacao_3dias_enviada: false,
            notificacao_vencimento_enviada: false,
          }, {
            onConflict: "user_id",
          });

        if (upsertError) {
          console.error("Error upserting subscription:", upsertError);
        } else {
          console.log(`Subscription created/updated for user: ${userId}, plan: ${plano}`);
        }

        // Create notification
        await supabase.from("notificacoes").insert({
          user_id: userId,
          tipo: "sucesso",
          titulo: "Assinatura ativada!",
          mensagem: `Seu plano ${plano === "nexsiles_max" ? "Nexsiles Max" : "Nexsiles"} foi ativado com sucesso!`,
          link: "/planos",
        });

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error("Missing user_id in subscription metadata");
          break;
        }

        // Update subscription dates
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + 30);

        const { error: updateError } = await supabase
          .from("assinaturas")
          .update({
            status: "ativo",
            data_vencimento: dataVencimento.toISOString(),
            notificacao_3dias_enviada: false,
            notificacao_vencimento_enviada: false,
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        } else {
          console.log(`Subscription renewed for subscription: ${subscriptionId}`);
        }

        // Create notification
        await supabase.from("notificacoes").insert({
          user_id: userId,
          tipo: "sucesso",
          titulo: "Pagamento confirmado!",
          mensagem: "Sua assinatura foi renovada com sucesso.",
          link: "/planos",
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Get subscription to find user
        const { data: assinatura } = await supabase
          .from("assinaturas")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (assinatura?.user_id) {
          await supabase.from("notificacoes").insert({
            user_id: assinatura.user_id,
            tipo: "alerta",
            titulo: "Falha no pagamento",
            mensagem: "Houve um problema com o pagamento da sua assinatura. Por favor, atualize seu método de pagamento.",
            link: "/planos",
          });
        }

        console.log(`Payment failed for subscription: ${subscriptionId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        // Update subscription status
        const { error: updateError } = await supabase
          .from("assinaturas")
          .update({ status: "cancelado" })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        } else {
          console.log(`Subscription cancelled: ${subscription.id}`);
        }

        if (userId) {
          await supabase.from("notificacoes").insert({
            user_id: userId,
            tipo: "info",
            titulo: "Assinatura cancelada",
            mensagem: "Sua assinatura foi cancelada. Você ainda pode usar o sistema até o fim do período pago.",
            link: "/planos",
          });
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Check if subscription status changed
        if (subscription.status === "past_due" || subscription.status === "unpaid") {
          const { data: assinatura } = await supabase
            .from("assinaturas")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (assinatura?.user_id) {
            await supabase.from("notificacoes").insert({
              user_id: assinatura.user_id,
              tipo: "alerta",
              titulo: "Pagamento pendente",
              mensagem: "Sua assinatura está com pagamento pendente. Atualize seu método de pagamento para evitar interrupção do serviço.",
              link: "/planos",
            });
          }
        }

        console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
