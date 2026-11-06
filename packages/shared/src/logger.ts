import pino from "pino";

export function createLogger(component: string) {
  const base = pino({
    level: process.env.LOG_LEVEL || "info",
    base: { component },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
  return base;
}

export type Logger = ReturnType<typeof createLogger>;
