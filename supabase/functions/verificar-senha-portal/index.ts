/**
 * Login do portal da revendedora (compatibilidade).
 *
 * O portal passou a chamar a RPC `portal_login` direto, que verifica a senha
 * (bcrypt), aplica rate limit por e-mail e abre uma sessão em public_sessions.
 * Esta função permanece apenas para clientes antigos e delega para a mesma RPC —
 * assim ela deixa de ser um oráculo de senha: não existe mais o endpoint
 * "confere esta senha para este revendedora_id" sem limite de tentativas.
 *
 * Retorno: { success, token, revendedora } — o token é a credencial da sessão.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { parseJson, z } from "../_shared/validate.ts";

const BodySchema = z.object({
  email: z.string().email().max(200),
  senha: z.string().min(1).max(200),
});

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  // Limite por IP (o limite por e-mail é aplicado dentro de portal_login).
  const rl = await rateLimit(req, "verificar-senha-portal", { maxRequests: 20, windowSeconds: 60 });
  if (rl) return rl;

  try {
    const parsed = await parseJson(req, BodySchema);
    if (parsed.error) return parsed.error;
    const { email, senha } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("portal_login", {
      p_email: email,
      p_senha: senha,
    });

    if (error) {
      if ((error.message ?? "").includes("MUITAS_TENTATIVAS")) {
        return jsonResponse(
          { success: false, message: "Muitas tentativas. Aguarde alguns minutos." },
          429,
        );
      }
      console.error("[verificar-senha-portal] rpc error", error);
      return jsonResponse({ success: false, message: "Erro na verificação" }, 500);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.token) {
      // Mesma resposta para e-mail inexistente e senha errada.
      return jsonResponse({ success: false, message: "E-mail ou senha incorretos" }, 401);
    }

    return jsonResponse({
      success: true,
      message: "Login válido",
      token: row.token,
      revendedora: {
        id: row.id,
        nome: row.nome,
        email: row.email,
        telefone: row.telefone,
        comissao_percentual: row.comissao_percentual,
      },
    });
  } catch (error) {
    console.error("[verificar-senha-portal] erro", error);
    return jsonResponse({ success: false, message: "Erro interno" }, 500);
  }
});
