import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { parseJson, z } from "../_shared/validate.ts";

const BodySchema = z.object({
  email: z.string().email().max(255),
  plano: z.enum(["nexsiles", "nexsiles_max"]),
  valor_pago: z.number().nonnegative().optional(),
  valido_ate: z.string().datetime().optional(),
});

function gerarCodigo(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 12; i++) result += chars.charAt(buf[i] % chars.length);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit by IP — protects shared-secret endpoint
  const rl = await rateLimit(req, "criar-codigo-externo", { maxRequests: 30 });
  if (rl) return rl;

  try {
    // Validate shared secret
    const secret = req.headers.get("x-cross-secret");
    const expectedSecret = Deno.env.get("CROSS_PROJECT_SECRET");

    if (!secret || !expectedSecret || secret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = await parseJson(req, BodySchema);
    if (parsed.error) return parsed.error;
    const { email, plano, valor_pago, valido_ate } = parsed.data;

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
