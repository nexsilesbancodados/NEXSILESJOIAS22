import { getServiceClient } from "./supabase.ts";
import { jsonResponse } from "./cors.ts";

export const getClientIp = (req: Request): string => {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
};

/**
 * Returns null when allowed, or a 429 Response when rate-limited.
 * Defaults: 60 requests per 60 seconds per identifier+endpoint.
 */
export async function rateLimit(
  req: Request,
  endpoint: string,
  opts: { maxRequests?: number; windowSeconds?: number; identifier?: string } = {}
): Promise<Response | null> {
  try {
    const supabase = getServiceClient();
    const identifier = opts.identifier ?? getClientIp(req);
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: opts.maxRequests ?? 60,
      p_window_seconds: opts.windowSeconds ?? 60,
    });
    if (error) {
      console.error("[rate-limit] error", error);
      return null; // fail-open to avoid blocking legitimate traffic
    }
    if (data === false) {
      return jsonResponse(
        { error: "Too many requests", retry_after: opts.windowSeconds ?? 60 },
        429
      );
    }
    return null;
  } catch (e) {
    console.error("[rate-limit] exception", e);
    return null;
  }
}
