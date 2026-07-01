import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Assinatura {
  id: string;
  user_id: string;
  plano: string;
  status: string;
  data_vencimento: string;
  notificacao_3dias_enviada: boolean;
  notificacao_vencimento_enviada: boolean;
}

interface Profile {
  email: string;
  nome: string;
}

const PLANOS = {
  nexsiles: { nome: "Nexsiles", valor: 189.00 },
  nexsiles_max: { nome: "Nexsiles Max", valor: 249.00 },
};

const APP_URL = "https://nexsiles.com.br";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function generateEmailHtml(
  tipo: "3dias" | "vencimento" | "expirado",
  nome: string,
  plano: string,
  dataVencimento: string,
  diasRestantes?: number
): string {
  const planoInfo = PLANOS[plano as keyof typeof PLANOS] || { nome: plano, valor: 0 };
  const dataFormatada = formatDate(dataVencimento);

  const buttonStyles = `display: inline-block; background: linear-gradient(135deg, #8B5CF6, #A855F7); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;`;

  let content = "";
  let urgencyColor = "";

  switch (tipo) {
    case "3dias":
      urgencyColor = "#F59E0B";
      content = `<p>Olá <strong>${nome}</strong>,</p><p>Seu plano <strong>${planoInfo.nome}</strong> vence em <strong style="color: ${urgencyColor}">${diasRestantes} dia${diasRestantes! > 1 ? "s" : ""}</strong>, no dia <strong>${dataFormatada}</strong>.</p><p>Renove agora para garantir acesso contínuo.</p>`;
      break;
    case "vencimento":
      urgencyColor = "#EF4444";
      content = `<p>Olá <strong>${nome}</strong>,</p><p>Seu plano <strong>${planoInfo.nome}</strong> vence <strong style="color: ${urgencyColor}">HOJE</strong>!</p><p>Renove agora para não perder acesso.</p>`;
      break;
    case "expirado":
      urgencyColor = "#DC2626";
      content = `<p>Olá <strong>${nome}</strong>,</p><p>Seu plano <strong>${planoInfo.nome}</strong> expirou.</p><p style="color: ${urgencyColor}; font-weight: 600;">O sistema está em modo leitura.</p><p>Renove agora para recuperar o acesso!</p>`;
      break;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;color:#333"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="text-align:center;margin-bottom:30px"><h1 style="color:#8B5CF6;margin:0;font-size:28px">Nexsiles</h1><p style="color:#666;margin-top:5px">Sistema de Gestão de Joias</p></div><div style="background:#fff;border-radius:12px;padding:30px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">${content}<div style="background:#F9FAFB;border-radius:8px;padding:20px;margin:25px 0"><p style="margin:0 0 10px 0;font-weight:600;color:#374151">Detalhes do Plano:</p><p style="margin:5px 0;color:#6B7280"><span style="color:#374151;font-weight:500">Plano:</span> ${planoInfo.nome}</p><p style="margin:5px 0;color:#6B7280"><span style="color:#374151;font-weight:500">Valor:</span> R$ ${planoInfo.valor.toFixed(2).replace(".", ",")}/mês</p><p style="margin:5px 0;color:#6B7280"><span style="color:#374151;font-weight:500">Vencimento:</span> ${dataFormatada}</p></div><div style="text-align:center"><a href="${APP_URL}/planos" style="${buttonStyles}">Renovar Assinatura</a></div></div><div style="text-align:center;margin-top:30px;color:#9CA3AF;font-size:12px"><p>Email automático do sistema Nexsiles.</p></div></div></body></html>`;
}

async function sendBrevoEmail(to: string, subject: string, htmlContent: string) {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) return false;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "NexSiles", email: "contato@nexsiles.com.br" },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Brevo error:", err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Brevo send failed:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Cron protegido: exige x-cron-secret quando CRON_SECRET está configurado.
  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    const { data: assinaturas, error: assinaturasError } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("status", "ativo");

    if (assinaturasError) throw assinaturasError;

    const results = {
      checked: 0,
      notificacoes3dias: 0,
      notificacoesVencimento: 0,
      expiradas: 0,
      emailsEnviados: 0,
      emailsFalhados: 0,
    };

    for (const assinatura of assinaturas as Assinatura[]) {
      results.checked++;
      const dataVencimento = new Date(assinatura.data_vencimento);

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, nome")
        .eq("user_id", assinatura.user_id)
        .single();

      const userEmail = (profile as Profile)?.email;
      const userName = (profile as Profile)?.nome || "Cliente";

      if (dataVencimento <= now) {
        await supabase.from("assinaturas").update({ status: "expirado" }).eq("id", assinatura.id);

        let emailEnviado = false;
        if (userEmail) {
          const html = generateEmailHtml("expirado", userName, assinatura.plano, assinatura.data_vencimento);
          emailEnviado = await sendBrevoEmail(userEmail, `⚠️ Seu plano expirou - Nexsiles`, html);
          emailEnviado ? results.emailsEnviados++ : results.emailsFalhados++;
        }

        await supabase.from("notificacoes_assinatura").insert({
          user_id: assinatura.user_id, tipo: "expirado",
          titulo: "Seu plano expirou",
          mensagem: "Seu plano expirou e o sistema está em modo leitura. Renove agora.",
          email_enviado: emailEnviado,
        });
        await supabase.from("notificacoes").insert({
          user_id: assinatura.user_id, tipo: "alerta",
          titulo: "Plano Expirado", mensagem: "Seu plano expirou. O sistema está em modo leitura.",
          link: "/planos",
        });
        results.expiradas++;
        continue;
      }

      const isToday = dataVencimento.getDate() === now.getDate() && dataVencimento.getMonth() === now.getMonth() && dataVencimento.getFullYear() === now.getFullYear();

      if (isToday && !assinatura.notificacao_vencimento_enviada) {
        let emailEnviado = false;
        if (userEmail) {
          const html = generateEmailHtml("vencimento", userName, assinatura.plano, assinatura.data_vencimento);
          emailEnviado = await sendBrevoEmail(userEmail, `🔔 Seu plano vence HOJE! - Nexsiles`, html);
          emailEnviado ? results.emailsEnviados++ : results.emailsFalhados++;
        }
        await supabase.from("notificacoes_assinatura").insert({
          user_id: assinatura.user_id, tipo: "aviso_vencimento",
          titulo: "Seu plano vence hoje!", mensagem: "Renove agora para não perder acesso.",
          email_enviado: emailEnviado,
        });
        await supabase.from("notificacoes").insert({
          user_id: assinatura.user_id, tipo: "alerta",
          titulo: "Plano vence hoje!", mensagem: "Renove para continuar usando o sistema.",
          link: "/planos",
        });
        await supabase.from("assinaturas").update({ notificacao_vencimento_enviada: true }).eq("id", assinatura.id);
        results.notificacoesVencimento++;
        continue;
      }

      const diffTime = dataVencimento.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3 && diffDays > 0 && !assinatura.notificacao_3dias_enviada) {
        let emailEnviado = false;
        if (userEmail) {
          const html = generateEmailHtml("3dias", userName, assinatura.plano, assinatura.data_vencimento, diffDays);
          emailEnviado = await sendBrevoEmail(userEmail, `⏰ Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""} - Nexsiles`, html);
          emailEnviado ? results.emailsEnviados++ : results.emailsFalhados++;
        }
        await supabase.from("notificacoes_assinatura").insert({
          user_id: assinatura.user_id, tipo: "aviso_3dias",
          titulo: `Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""}`,
          mensagem: `Renove agora para garantir acesso contínuo.`,
          email_enviado: emailEnviado,
        });
        await supabase.from("notificacoes").insert({
          user_id: assinatura.user_id, tipo: "aviso",
          titulo: "Plano expirando em breve",
          mensagem: `Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""}. Renove para não perder acesso.`,
          link: "/planos",
        });
        await supabase.from("assinaturas").update({ notificacao_3dias_enviada: true }).eq("id", assinatura.id);
        results.notificacoes3dias++;
      }
    }

    console.log("Verificação concluída:", results);
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
