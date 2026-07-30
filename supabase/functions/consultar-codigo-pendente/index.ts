/**
 * Consulta o código de acesso pendente de um e-mail, usada pelo diálogo de
 * retorno do pagamento (PaymentReturnDialog) logo após o checkout.
 *
 * Substitui a RPC `get_pending_access_code`, que estava com GRANT para `anon`:
 * qualquer pessoa podia varrer e-mails para descobrir quem comprou um plano e
 * capturar o código antes do comprador. Aqui a mesma consulta passa por rate
 * limit por IP (5 por minuto) e nunca devolve dados além do código do e-mail
 * informado.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { parseJson, z } from "../_shared/validate.ts";

const BodySchema = z.object({
  email: z.string().email().max(200),
});

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  const rl = await rateLimit(req, "consultar-codigo-pendente", {
    maxRequests: 5,
    windowSeconds: 60,
  });
  if (rl) return rl;

  try {
    const parsed = await parseJson(req, BodySchema);
    if (parsed.error) return parsed.error;

    const email = parsed.data.email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("codigos_acesso")
      .select("codigo, plano, periodo")
      .eq("usado", false)
      .gt("valido_ate", new Date().toISOString())
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[consultar-codigo-pendente] erro", error);
      return jsonResponse({ error: "Erro ao consultar" }, 500);
    }

    if (!data) return jsonResponse({ pendente: false });

    return jsonResponse({
      pendente: true,
      codigo: data.codigo,
      plano: data.plano,
      periodo: data.periodo,
    });
  } catch (error) {
    console.error("[consultar-codigo-pendente] erro", error);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
