import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmailBrevo(apiKey: string, to: { email: string; name?: string }, from: { email: string; name: string }, subject: string, htmlContent: string, textContent?: string) {
  const payload: any = {
    sender: { name: from.name, email: from.email },
    to: [{ email: to.email, name: to.name || to.email }],
    subject,
    htmlContent,
  };
  if (textContent) payload.textContent = textContent;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error [${res.status}]: ${err}`);
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoKey) throw new Error("BREVO_API_KEY não configurada");

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

    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) throw new Error("Organização não encontrada");

    const body = await req.json();
    const { template_id, destinatario_email, destinatario_nome, variaveis, remetente_email, remetente_nome } = body;

    if (!template_id || !destinatario_email) {
      return new Response(JSON.stringify({ error: "template_id e destinatario_email são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    let assunto = template.assunto;
    let corpoHtml = template.corpo_html;
    let corpoTexto = template.corpo_texto || "";

    const vars = variaveis || {};
    vars["{data_hoje}"] = new Date().toLocaleDateString("pt-BR");

    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g");
      assunto = assunto.replace(regex, String(value));
      corpoHtml = corpoHtml.replace(regex, String(value));
      corpoTexto = corpoTexto.replace(regex, String(value));
    }

    const { data: logEntry, error: logError } = await supabaseAdmin
      .from("email_logs")
      .insert({
        organization_id: membership.organization_id,
        template_id,
        destinatario_email,
        destinatario_nome: destinatario_nome || null,
        assunto,
        status: "pendente",
      })
      .select("id")
      .single();

    if (logError) console.error("Error creating log:", logError);

    const fromEmail = remetente_email || "noreply@nexsales.online";
    const fromName = remetente_nome || "NexSiles";

    try {
      const result = await sendEmailBrevo(
        brevoKey,
        { email: destinatario_email, name: destinatario_nome },
        { email: fromEmail, name: fromName },
        assunto,
        corpoHtml,
        corpoTexto || undefined
      );

      if (logEntry?.id) {
        await supabaseAdmin
          .from("email_logs")
          .update({ status: "enviado", enviado_at: new Date().toISOString() })
          .eq("id", logEntry.id);
      }

      return new Response(
        JSON.stringify({ success: true, messageId: result?.messageId, log_id: logEntry?.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError: any) {
      console.error("Brevo error:", emailError);
      if (logEntry?.id) {
        await supabaseAdmin
          .from("email_logs")
          .update({ status: "erro", erro_mensagem: emailError.message })
          .eq("id", logEntry.id);
      }
      return new Response(
        JSON.stringify({ error: "Erro ao enviar e-mail", details: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
