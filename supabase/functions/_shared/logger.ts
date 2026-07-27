import { getServiceClient } from "./supabase.ts";

type Level = "info" | "warn" | "error" | "debug";

export function createLogger(scope: string) {
  const log = (level: Level, msg: string, meta?: Record<string, unknown>) => {
    const entry = {
      level,
      scope,
      msg,
      ts: new Date().toISOString(),
      ...(meta || {}),
    };
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  };
  return {
    info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
    debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  };
}

/**
 * Persiste erro crítico na tabela `edge_function_errors` para dashboard admin.
 * Não bloqueia a resposta se a persistência falhar (fail-open).
 */
export async function captureError(params: {
  functionName: string;
  error: unknown;
  requestPayload?: unknown;
  requestIp?: string;
  organizationId?: string | null;
  statusCode?: number;
}): Promise<void> {
  const { functionName, error, requestPayload, requestIp, organizationId, statusCode } = params;
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack ?? null : null;

  try {
    const supabase = getServiceClient();
    let payloadSafe: unknown = null;
    if (requestPayload) {
      try {
        payloadSafe = JSON.parse(JSON.stringify(requestPayload).slice(0, 10000));
      } catch {
        payloadSafe = { _truncated: true };
      }
    }
    await supabase.from("edge_function_errors").insert({
      function_name: functionName,
      error_message: errorMessage.slice(0, 2000),
      error_stack: errorStack?.slice(0, 5000) ?? null,
      request_payload: payloadSafe,
      request_ip: requestIp ?? null,
      organization_id: organizationId ?? null,
      status_code: statusCode ?? null,
    });
  } catch (e) {
    console.error("[captureError] failed to persist", e);
  }
}
