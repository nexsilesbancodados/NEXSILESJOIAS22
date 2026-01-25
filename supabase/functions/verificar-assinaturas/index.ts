import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

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
    };

    for (const assinatura of assinaturas as Assinatura[]) {
      results.checked++;
      const dataVencimento = new Date(assinatura.data_vencimento);

      // Check if expired
      if (dataVencimento <= now) {
        // Mark as expired
        await supabase
          .from("assinaturas")
          .update({ status: "expirado" })
          .eq("id", assinatura.id);

        // Send expiration notification
        await supabase.from("notificacoes_assinatura").insert({
          user_id: assinatura.user_id,
          tipo: "expirado",
          titulo: "Seu plano expirou",
          mensagem: "Seu plano expirou e o sistema está em modo leitura. Renove agora para continuar usando todas as funcionalidades.",
          email_enviado: false,
        });

        // Also add to regular notifications
        await supabase.from("notificacoes").insert({
          user_id: assinatura.user_id,
          tipo: "alerta",
          titulo: "Plano Expirado",
          mensagem: "Seu plano expirou. O sistema está em modo leitura.",
          link: "/configuracoes",
        });

        results.expiradas++;
        continue;
      }

      // Check if expires on due date (today)
      const isToday = 
        dataVencimento.getDate() === now.getDate() &&
        dataVencimento.getMonth() === now.getMonth() &&
        dataVencimento.getFullYear() === now.getFullYear();

      if (isToday && !assinatura.notificacao_vencimento_enviada) {
        await supabase.from("notificacoes_assinatura").insert({
          user_id: assinatura.user_id,
          tipo: "aviso_vencimento",
          titulo: "Seu plano vence hoje!",
          mensagem: "Seu plano vence hoje. Renove agora para não perder acesso às funcionalidades.",
          email_enviado: false,
        });

        await supabase.from("notificacoes").insert({
          user_id: assinatura.user_id,
          tipo: "alerta",
          titulo: "Plano vence hoje!",
          mensagem: "Seu plano vence hoje. Renove para continuar usando o sistema.",
          link: "/configuracoes",
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
        await supabase.from("notificacoes_assinatura").insert({
          user_id: assinatura.user_id,
          tipo: "aviso_3dias",
          titulo: `Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""}`,
          mensagem: `Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""}. Renove agora para garantir acesso contínuo.`,
          email_enviado: false,
        });

        await supabase.from("notificacoes").insert({
          user_id: assinatura.user_id,
          tipo: "aviso",
          titulo: "Plano expirando em breve",
          mensagem: `Seu plano vence em ${diffDays} dia${diffDays > 1 ? "s" : ""}. Renove para não perder acesso.`,
          link: "/configuracoes",
        });

        await supabase
          .from("assinaturas")
          .update({ notificacao_3dias_enviada: true })
          .eq("id", assinatura.id);

        results.notificacoes3dias++;
      }
    }

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
