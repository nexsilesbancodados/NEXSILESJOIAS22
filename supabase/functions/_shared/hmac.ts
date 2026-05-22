/**
 * HMAC signature verification helpers for webhooks.
 */

async function hmacHex(secret: string, payload: string, algo: "SHA-256" | "SHA-1" = "SHA-256") {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: algo },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

/**
 * Mercado Pago webhook signature (v1=...,ts=...).
 * Docs: https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks#editor_5
 */
export async function verifyMercadoPagoSignature(
  req: Request,
  rawBody: string,
  secret: string | undefined
): Promise<boolean> {
  if (!secret) return true; // not configured -> skip (logged by caller)
  const sigHeader = req.headers.get("x-signature");
  const reqId = req.headers.get("x-request-id");
  if (!sigHeader || !reqId) return false;

  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), (v || "").trim()];
    })
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const url = new URL(req.url);
  const dataId =
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    (() => {
      try {
        return JSON.parse(rawBody)?.data?.id?.toString() ?? "";
      } catch {
        return "";
      }
    })();

  const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
  const expected = await hmacHex(secret, manifest, "SHA-256");
  return timingSafeEqual(expected, v1);
}

/**
 * Stripe signature (t=...,v1=...).
 */
export async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string | null,
  secret: string | undefined,
  toleranceSec = 300
): Promise<boolean> {
  if (!secret) return true;
  if (!sigHeader) return false;
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), (v || "").trim()];
    })
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = await hmacHex(secret, `${t}.${rawBody}`, "SHA-256");
  return timingSafeEqual(expected, v1);
}

/**
 * Generic HMAC-SHA256 hex compare (e.g. Evolution / custom WhatsApp).
 */
export async function verifyHmacSha256(
  rawBody: string,
  providedHex: string | null,
  secret: string | undefined
): Promise<boolean> {
  if (!secret) return true;
  if (!providedHex) return false;
  const clean = providedHex.replace(/^sha256=/i, "");
  const expected = await hmacHex(secret, rawBody, "SHA-256");
  return timingSafeEqual(expected, clean);
}
