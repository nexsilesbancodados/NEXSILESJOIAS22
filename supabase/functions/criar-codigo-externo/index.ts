import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cross-secret",
};

function gerarCodigo(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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

    const { email, plano, valor_pago, valido_ate } = await req.json();

    // Validate required fields
    if (!email || !plano) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, plano" }),
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

    // Auto-generate unique code
    let codigo = "";
    let attempts = 0;
    while (attempts < 10) {
      codigo = gerarCodigo();
      const { data: existing } = await supabase
        .from("codigos_acesso")
        .select("id")
        .eq("codigo", codigo)
        .maybeSingle();
      if (!existing) break;
      attempts++;
    }

    const now = new Date();
    const defaultValidoAte = new Date(now);
    defaultValidoAte.setDate(defaultValidoAte.getDate() + 30);

    const { data, error } = await supabase
      .from("codigos_acesso")
      .insert({
        codigo,
        email: String(email).trim().toLowerCase(),
        plano,
        usado: false,
        valido_ate: valido_ate || defaultValidoAte.toISOString(),
        valor_pago: valor_pago ?? (plano === "nexsiles_max" ? 249 : 189),
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting codigo:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create access code", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format code for display: XXXX-XXXX-XXXX
    const codigoFormatado = `${codigo.slice(0, 4)}-${codigo.slice(4, 8)}-${codigo.slice(8, 12)}`;

    return new Response(
      JSON.stringify({ success: true, codigo, codigo_formatado: codigoFormatado }),
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
