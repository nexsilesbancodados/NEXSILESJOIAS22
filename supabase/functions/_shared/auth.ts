import { getServiceClient, getAnonClient } from "./supabase.ts";
import { jsonResponse } from "./cors.ts";

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: string;
}

/** Comparação de tempo constante para segredos/tokens. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/**
 * Detecta chamada interna servidor-a-servidor (uma edge function chamando outra
 * com `Authorization: Bearer <SERVICE_ROLE_KEY>`). Nesses casos o chamador é
 * confiável e o `organizationId` do body pode ser usado.
 */
export function isInternalServiceCall(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return !!serviceKey && !!token && timingSafeEqual(token, serviceKey);
}

/**
 * Proteção para endpoints chamados por OUTRO projeto (ex.: o site de vendas).
 * Exige o header `x-cross-secret` igual à env `CROSS_PROJECT_SECRET` (fail-closed).
 * Retorna null quando permitido, ou Response 401 quando bloqueado.
 */
export function requireCrossSecret(req: Request): Response | null {
  const provided = req.headers.get("x-cross-secret") ?? "";
  const expected = Deno.env.get("CROSS_PROJECT_SECRET") ?? "";
  if (!expected || !provided || !timingSafeEqual(provided, expected)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  return null;
}

/**
 * Valida o Bearer token do chamador e resolve a organização + role a partir de
 * `memberships`. O `organization_id` é SEMPRE derivado do token — nunca confiado
 * do body da requisição (evita IDOR cross-tenant).
 *
 * Uso:
 *   const auth = await requireAuth(req);            // qualquer membro
 *   const auth = await requireAuth(req, { roles: ["owner", "admin"] });
 *   if (auth.error) return auth.error;
 *   const { userId, organizationId, role } = auth.ctx;
 */
export async function requireAuth(
  req: Request,
  opts: { roles?: string[] } = {}
): Promise<
  | { ctx: AuthContext; error?: undefined }
  | { ctx?: undefined; error: Response }
> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: jsonResponse({ error: "Não autorizado" }, 401) };
  }

  // Valida o token contra o Auth server usando o header do próprio chamador.
  const { data: userData, error: userError } = await getAnonClient(authHeader).auth.getUser();
  if (userError || !userData?.user) {
    return { error: jsonResponse({ error: "Token inválido" }, 401) };
  }
  const userId = userData.user.id;

  // Resolve a organização pelo membership (service role só para leitura da associação).
  const { data: membership, error: memErr } = await getServiceClient()
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (memErr || !membership) {
    return { error: jsonResponse({ error: "Organização não encontrada" }, 403) };
  }

  if (opts.roles && !opts.roles.includes(membership.role)) {
    return { error: jsonResponse({ error: "Sem permissão para esta ação" }, 403) };
  }

  return {
    ctx: {
      userId,
      organizationId: membership.organization_id as string,
      role: membership.role as string,
    },
  };
}

/**
 * Proteção para funções agendadas (cron).
 *
 * Aceita duas formas de provar que a chamada é do agendador:
 *   1. Header `x-cron-secret` igual à env `CRON_SECRET`.
 *   2. `Authorization: Bearer <SERVICE_ROLE_KEY>` (chamada interna).
 *
 * Retorna null quando permitido, ou uma Response 401 quando bloqueado.
 *
 * ⚠️ Cuidado com o histórico deste arquivo. A versão anterior fazia:
 *
 *     const provided = req.headers.get("x-cron-secret") ||
 *       (req.headers.get("Authorization")?.startsWith("Bearer ") ? "" : ...)
 *
 * ou seja: qualquer requisição com `Authorization: Bearer ...` era comparada
 * como string vazia. E os `cron.schedule` das migrations mandam exatamente
 * isso — `Bearer <anon_key>` — e nenhum `x-cron-secret`. Resultado: configurar
 * CRON_SECRET (como o SEGURANCA.md recomenda) fazia TODOS os jobs passarem a
 * responder 401 em silêncio; assinatura nenhuma expirava e nenhum aviso de
 * vencimento saía. Só "funcionava" enquanto o segredo estava ausente — que é
 * justamente quando o endpoint fica aberto.
 *
 * Agora o header é lido de verdade, e a migration de cron passa a enviá-lo
 * (ver `20260812000000_cron_com_segredo.sql`), então configurar o segredo é
 * seguro.
 *
 * Continua liberando quando `CRON_SECRET` não está configurado, para não
 * derrubar os jobs de quem ainda não configurou — mas agora configurar é o
 * caminho sem efeito colateral. Faça isso.
 */
export function requireCronSecret(req: Request): Response | null {
  // Chamada interna servidor-a-servidor sempre vale.
  if (isInternalServiceCall(req)) return null;

  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) {
    console.warn(
      "[cron] CRON_SECRET não configurado — endpoint de cron está ABERTO. Configure para fechar."
    );
    return null;
  }

  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!provided || !timingSafeEqual(provided, secret)) {
    return jsonResponse({ error: "Não autorizado" }, 401);
  }
  return null;
}
