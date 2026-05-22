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
