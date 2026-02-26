import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify password using bcrypt via database function
    const { data: isValid, error: verifyError } = await supabaseAdmin
      .rpc('verify_portal_password_by_id', {
        p_revendedora_id: revendedora_id,
        p_password: senha
      });

    if (verifyError) {
      console.error("Error verifying password:", verifyError);
      return new Response(
        JSON.stringify({ success: false, message: "Erro na verificação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
