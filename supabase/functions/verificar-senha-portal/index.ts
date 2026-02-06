import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { revendedora_id, senha } = await req.json();

    if (!revendedora_id || !senha) {
      return new Response(
        JSON.stringify({ success: false, message: "Dados inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the password hash securely (never exposed to client)
    const { data, error } = await supabaseAdmin
      .from("revendedoras")
      .select("senha_portal")
      .eq("id", revendedora_id)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ success: false, message: "Revendedora não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simple password comparison (for now - should use bcrypt in production)
    // Note: In a real production environment, you'd want to hash passwords with bcrypt
    const isValid = data.senha_portal === senha;

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, message: "Senha incorreta" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Login válido" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in verificar-senha-portal:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
