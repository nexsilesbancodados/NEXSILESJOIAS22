import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

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
  nexsiles: { nome: "Nexsiles", valor: 49.90 },
  nexsiles_max: { nome: "Nexsiles Max", valor: 99.90 },
};

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
  
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
  `;

  const buttonStyles = `
    display: inline-block;
    background: linear-gradient(135deg, #8B5CF6, #A855F7);
    color: white;
    padding: 14px 28px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 20px;
  `;

  let subject = "";
  let content = "";
  let urgencyColor = "";

  switch (tipo) {
    case "3dias":
      subject = `⏰ Seu plano ${planoInfo.nome} vence em ${diasRestantes} dia${diasRestantes! > 1 ? "s" : ""}`;
      urgencyColor = "#F59E0B";
      content = `
        <p>Olá <strong>${nome}</strong>,</p>
        <p>Estamos entrando em contato para informar que seu plano <strong>${planoInfo.nome}</strong> 
        vence em <strong style="color: ${urgencyColor}">${diasRestantes} dia${diasRestantes! > 1 ? "s" : ""}</strong>, 
        no dia <strong>${dataFormatada}</strong>.</p>
        <p>Para garantir acesso contínuo a todas as funcionalidades do sistema, recomendamos renovar sua assinatura agora.</p>
      `;
      break;
    case "vencimento":
      subject = `🔔 Seu plano ${planoInfo.nome} vence HOJE!`;
      urgencyColor = "#EF4444";
      content = `
        <p>Olá <strong>${nome}</strong>,</p>
        <p>Seu plano <strong>${planoInfo.nome}</strong> vence <strong style="color: ${urgencyColor}">HOJE</strong>!</p>
        <p>Renove agora para não perder acesso às funcionalidades do sistema. Após o vencimento, 
        o sistema entrará em modo leitura, impedindo criação e edição de dados.</p>
      `;
      break;
    case "expirado":
      subject = `⚠️ Seu plano ${planoInfo.nome} expirou`;
      urgencyColor = "#DC2626";
      content = `
        <p>Olá <strong>${nome}</strong>,</p>
        <p>Infelizmente, seu plano <strong>${planoInfo.nome}</strong> expirou.</p>
        <p style="color: ${urgencyColor}; font-weight: 600;">O sistema está em modo leitura. 
        Você ainda pode visualizar seus dados, mas não poderá criar ou editar informações.</p>
        <p>Renove agora para recuperar o acesso completo às funcionalidades!</p>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; ${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8B5CF6; margin: 0; font-size: 28px;">Nexsiles</h1>
          <p style="color: #666; margin-top: 5px;">Sistema de Gestão de Joias</p>
        </div>
        
        <!-- Content -->
        <div style="background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${content}
          
          <!-- Plan Details -->
          <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #374151;">Detalhes do Plano:</p>
            <p style="margin: 5px 0; color: #6B7280;">
              <span style="color: #374151; font-weight: 500;">Plano:</span> ${planoInfo.nome}
            </p>
            <p style="margin: 5px 0; color: #6B7280;">
              <span style="color: #374151; font-weight: 500;">Valor:</span> R$ ${planoInfo.valor.toFixed(2).replace(".", ",")} /mês
            </p>
            <p style="margin: 5px 0; color: #6B7280;">
              <span style="color: #374151; font-weight: 500;">Vencimento:</span> ${dataFormatada}
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/planos" style="${buttonStyles}">
              Renovar Assinatura
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 12px;">
          <p>Este é um email automático do sistema Nexsiles.</p>
          <p>Dúvidas? Entre em contato com nosso suporte.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Initialize Resend if API key is available
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const now = new Date();

    // Get all active subscriptions
    const { data: assinaturas, error: assinaturasError } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("status", "ativo");

    if (assinaturasError) {
      throw assinaturasError;
    }

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

      // Get user profile for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, nome")
        .eq("user_id", assinatura.user_id)
        .single();

      const userEmail = (profile as Profile)?.email;
      const userName = (profile as Profile)?.nome || "Cliente";

      // Check if expired
      if (dataVencimento <= now) {
        // Mark as expired
        await supabase
          .from("assinaturas")
          .update({ status: "expirado" })
          .eq("id", assinatura.id);

        // Send email notification
        let emailEnviado = false;
        if (resend && userEmail) {
          try {
            const emailHtml = generateEmailHtml(
              "expirado",
              userName,
              assinatura.plano,
              assinatura.data_vencimento
            );
            
            await resend.emails.send({
              from: "Nexsiles <suporte@nexsiles.online>",
              to: [userEmail],
              subject: `⚠️ Seu plano expirou - Nexsiles`,
              html: emailHtml,
            });
            
            emailEnviado = true;
            results.emailsEnviados++;
            console.log(`Email de expiração enviado para: ${userEmail}`);
          } catch (emailError) {
            console.error(`Erro ao enviar email para ${userEmail}:`, emailError);
            results.emailsFalhados++;
          }
        }

        // Create notification
        await supabase.from("notificacoes_assinatura").insert({
          user_id: assinatura.user_id,
          tipo: "expirado",
          titulo: "Seu plano expirou",
          mensagem: "Seu plano expirou e o sistema está em modo leitura. Renove agora para continuar usando todas as funcionalidades.",
          email_enviado: emailEnviado,
        });

        await supabase.from("notificacoes").insert({
          user_id: assinatura.user_id,
          tipo: "alerta",
          titulo: "Plano Expirado",
          mensagem: "Seu plano expirou. O sistema está em modo leitura.",
          link: "/planos",
        });

        results.expiradas++;
        continue;
      }

      // Check if expires today
      const isToday = 
        dataVencimento.getDate() === now.getDate() &&
        dataVencimento.getMonth() === now.getMonth() &&
        dataVencimento.getFullYear() === now.getFullYear();

      if (isToday && !assinatura.notificacao_vencimento_enviada) {
        let emailEnviado = false;
        if (resend && userEmail) {
          try {
            const emailHtml = generateEmailHtml(
              "vencimento",
              userName,
              assinatura.plano,
              assinatura.data_vencimento
            );
            
            await resend.emails.send({
              from: "Nexsiles <suporte@nexsiles.online>",
              to: [userEmail],
              subject: `🔔 Seu plano vence HOJE! - Nexsiles`,
              html: emailHtml,
            });
            
            emailEnviado = true;
            results.emailsEnviados++;
            console.log(`Email de vencimento enviado para: ${userEmail}`);
          } catch (emailError) {
            console.error(`Erro ao enviar email para ${userEmail}:`, emailError);
            results.emailsFalhados++;
          }
        }

        await supabase.from("notificacoes_assinatura").insert({
          user_id: assinatura.user_id,
          tipo: "aviso_vencimento",
          titulo: "Seu plano vence hoje!",
          mensagem: "Seu plano vence hoje. Renove agora para não perder acesso às funcionalidades.",
          email_enviado: emailEnviado,
        });

        await supabase.from("notificacoes").insert({
          user_id: assinatura.user_id,
          tipo: "alerta",
          titulo: "Plano vence hoje!",
          mensagem: "Seu plano vence hoje. Renove para continuar usando o sistema.",
          link: "/planos",
        });

        await supabase
          .from("assinaturas")
          .update({ notificacao_vencimento_enviada: true })
          .eq("id", assinatura.id);

        results.notificacoesVencimento++;
        continue;
      }

      // Check if expires in 3 days
      const diffTime = dataVencimento.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3 && diffDays > 0 && !assinatura.notificacao_3dias_enviada) {
        let emailEnviado = false;
        if (resend && userEmail) {
          try {
            const emailHtml = generateEmailHtml(
              "3dias",
              userName,
              assinatura.plano,
              assinatura.data_vencimento,
              diffDays
            );
            
            await resend.emails.send({
              from: "Nexsiles <suporte@nexsiles.online>",
              to: [userEmail],
              subject: `⏰ Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""} - Nexsiles`,
              html: emailHtml,
            });
            
            emailEnviado = true;
            results.emailsEnviados++;
            console.log(`Email de aviso 3 dias enviado para: ${userEmail}`);
          } catch (emailError) {
            console.error(`Erro ao enviar email para ${userEmail}:`, emailError);
            results.emailsFalhados++;
          }
        }

        await supabase.from("notificacoes_assinatura").insert({
          user_id: assinatura.user_id,
          tipo: "aviso_3dias",
          titulo: `Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""}`,
          mensagem: `Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""}. Renove agora para garantir acesso contínuo.`,
          email_enviado: emailEnviado,
        });

        await supabase.from("notificacoes").insert({
          user_id: assinatura.user_id,
          tipo: "aviso",
          titulo: "Plano expirando em breve",
          mensagem: `Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""}. Renove para não perder acesso.`,
          link: "/planos",
        });

        await supabase
          .from("assinaturas")
          .update({ notificacao_3dias_enviada: true })
          .eq("id", assinatura.id);

        results.notificacoes3dias++;
      }
    }

    console.log("Verificação de assinaturas concluída:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verificação de assinaturas concluída",
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error checking subscriptions:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
