import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }
    const resend = new Resend(resendKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get user's organization
    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      throw new Error("Organização não encontrada");
    }

    const body = await req.json();
    const { template_id, destinatario_email, destinatario_nome, variaveis, remetente_email, remetente_nome } = body;

    if (!template_id || !destinatario_email) {
      return new Response(JSON.stringify({ error: "template_id e destinatario_email são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("id", template_id)
      .eq("organization_id", membership.organization_id)
      .single();

    if (templateError || !template) {
      return new Response(JSON.stringify({ error: "Template não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Replace variables in subject and body
    let assunto = template.assunto;
    let corpoHtml = template.corpo_html;
    let corpoTexto = template.corpo_texto || "";

    const vars = variaveis || {};
    // Add default variables
    vars["{data_hoje}"] = new Date().toLocaleDateString("pt-BR");

    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g");
      assunto = assunto.replace(regex, String(value));
      corpoHtml = corpoHtml.replace(regex, String(value));
      corpoTexto = corpoTexto.replace(regex, String(value));
    }

    // Create log entry first
    const { data: logEntry, error: logError } = await supabaseAdmin
      .from("email_logs")
      .insert({
        organization_id: membership.organization_id,
        template_id: template_id,
        destinatario_email,
        destinatario_nome: destinatario_nome || null,
        assunto,
        status: "pendente",
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Error creating log:", logError);
    }

    // Send email via Resend
    const fromEmail = remetente_email || "noreply@nexsales.online";
    const fromName = remetente_nome || "NexSiles";

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [destinatario_email],
      subject: assunto,
      html: corpoHtml,
      text: corpoTexto || undefined,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      // Update log with error
      if (logEntry?.id) {
        await supabaseAdmin
          .from("email_logs")
          .update({
            status: "erro",
            erro_mensagem: emailError.message || JSON.stringify(emailError),
          })
          .eq("id", logEntry.id);
      }
      return new Response(
        JSON.stringify({ error: "Erro ao enviar e-mail", details: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update log as sent
    if (logEntry?.id) {
      await supabaseAdmin
        .from("email_logs")
        .update({
          status: "enviado",
          enviado_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult?.id, log_id: logEntry?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
