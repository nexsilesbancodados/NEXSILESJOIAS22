import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireAuth } from "../_shared/auth.ts";

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
    const clientId = Deno.env.get("MERCADOPAGO_CLIENT_ID")!;
    const clientSecret = Deno.env.get("MERCADOPAGO_CLIENT_SECRET")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Exige usuário autenticado com papel privilegiado; a org vem do token (não do body).
    const auth = await requireAuth(req, { roles: ["owner", "admin"] });
    if (auth.error) return auth.error;
    const organization_id = auth.ctx.organizationId;

    const body = await req.json();
    const { code, redirect_uri } = body;

    if (!code) throw new Error("Authorization code is required");

    console.log("Exchanging OAuth code for organization:", organization_id);

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirect_uri || `${req.headers.get("origin")}/loja-virtual`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("MP OAuth error:", errorText);
      throw new Error("Falha ao conectar com o Mercado Pago. Tente novamente.");
    }

    const tokenData = await tokenResponse.json();
    console.log("OAuth token received for user_id:", tokenData.user_id);

    const {
      access_token,
      public_key,
      user_id: mp_user_id,
      refresh_token,
    } = tokenData;

    if (!access_token) throw new Error("No access_token received from Mercado Pago");

    // Save credentials to ecommerce_config
    const { data: existingConfig } = await supabase
      .from("ecommerce_config")
      .select("id")
      .eq("organization_id", organization_id)
      .maybeSingle();

    const updatePayload = {
      mercadopago_access_token: access_token,
      mercadopago_public_key: public_key || null,
      mp_user_id: String(mp_user_id),
    };

    if (existingConfig?.id) {
      const { error } = await supabase
        .from("ecommerce_config")
        .update(updatePayload)
        .eq("id", existingConfig.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("ecommerce_config")
        .insert({
          organization_id,
          slug: `loja-${organization_id.slice(0, 8)}`,
          nome_loja: "Minha Loja",
          ...updatePayload,
        });
      if (error) throw error;
    }

    console.log("MP credentials saved for org:", organization_id);

    return new Response(
      JSON.stringify({
        success: true,
        mp_user_id: String(mp_user_id),
        has_public_key: !!public_key,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in mercadopago-oauth:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
