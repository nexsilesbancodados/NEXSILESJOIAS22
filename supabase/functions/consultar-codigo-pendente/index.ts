/**
 * Consulta o código de acesso pendente logo após o checkout, para o diálogo de
 * retorno do pagamento (PaymentReturnDialog).
 *
 * Histórico: substituiu a RPC `get_pending_access_code`, que estava com GRANT
 * para `anon`. A troca por Edge Function trouxe rate limit, mas o endpoint
 * continuava devolvendo o código para quem informasse apenas o e-mail — bastava
 * conhecer (ou enumerar) o e-mail de um comprador para capturar o código que ele
 * pagou, já que o rate limit é por IP e um pool de proxies o contorna.
 *
 * Agora o código só é devolvido mediante prova de posse do pagamento: o
 * `payment_id` que o Mercado Pago anexa à back_url do retorno precisa bater com
 * o `mercadopago_payment_id` gravado na linha. Quem chegou pelo checkout tem
 * esse valor; quem só chutou o e-mail, não.
 *
 * Sem `payment_id` a resposta informa apenas SE existe algo pendente, para o
 * diálogo poder orientar o comprador a pegar o código no e-mail — que
 * `gerar-codigo-acesso` já envia.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { parseJson, z } from "../_shared/validate.ts";

const BodySchema = z.object({
  email: z.string().email().max(200),
  // Opcional: o retorno do Mercado Pago nem sempre traz (ex.: PIX/boleto que
  // ainda não confirmou). Sem ele a função não revela o código.
  payment_id: z.string().max(64).optional(),
});

/** Comparação de tempo constante, para não vazar o id por tempo de resposta. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

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
    const paymentId = parsed.data.payment_id?.trim();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("codigos_acesso")
      .select("codigo, plano, periodo, mercadopago_payment_id")
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

    const gravado = data.mercadopago_payment_id
      ? String(data.mercadopago_payment_id)
      : "";
    const comprovou = !!paymentId && !!gravado &&
      timingSafeEqual(paymentId, gravado);

    if (!comprovou) {
      // Existe código pendente, mas quem está perguntando não provou ser o
      // comprador. O diálogo usa `enviado_por_email` para orientar sem expor
      // nada — inclusive quando o próprio comprador chega sem o payment_id.
      return jsonResponse({ pendente: true, enviado_por_email: true });
    }

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
