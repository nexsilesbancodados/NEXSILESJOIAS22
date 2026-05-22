import { z, ZodSchema } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { jsonResponse } from "./cors.ts";

export { z };

export async function parseJson<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: jsonResponse({ error: "Invalid JSON body" }, 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: jsonResponse(
        { error: "Validation failed", details: parsed.error.flatten() },
        400
      ),
    };
  }
  return { data: parsed.data };
}
