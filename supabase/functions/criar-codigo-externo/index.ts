import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cross-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate shared secret
    const secret = req.headers.get("x-cross-secret");
    const expectedSecret = Deno.env.get("CROSS_PROJECT_SECRET");

    if (!secret || secret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { codigo, email, plano, valor_pago, valido_ate } = await req.json();

    // Validate required fields
    if (!codigo || !email || !plano) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: codigo, email, plano" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate codigo format (12 chars alphanumeric)
    const codigoClean = String(codigo).replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (codigoClean.length !== 12) {
      return new Response(
        JSON.stringify({ error: "Invalid codigo format. Must be 12 alphanumeric characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate plano
    const planosValidos = ["nexsiles", "nexsiles_max"];
    if (!planosValidos.includes(plano)) {
      return new Response(
        JSON.stringify({ error: "Invalid plano. Must be 'nexsiles' or 'nexsiles_max'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const defaultValidoAte = new Date(now);
    defaultValidoAte.setDate(defaultValidoAte.getDate() + 30);

    const { data, error } = await supabase
      .from("codigos_acesso")
      .upsert(
        {
          codigo: codigoClean,
          email: String(email).trim().toLowerCase(),
          plano,
          usado: false,
          valido_ate: valido_ate || defaultValidoAte.toISOString(),
          valor_pago: valor_pago ?? (plano === "nexsiles_max" ? 249 : 189),
        },
        { onConflict: "codigo" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error upserting codigo:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create access code", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, codigo: codigoClean }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
