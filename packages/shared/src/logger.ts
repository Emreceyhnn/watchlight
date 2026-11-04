import pino from "pino";

/**
 * Structured JSON logger shared by web and worker. Each call site should
 * pass a short `component` so log aggregation can filter by subsystem
 * (e.g. logger("Worker:RuleEngine")).
 */
export function createLogger(component: string) {
  const base = pino({
    level: process.env.LOG_LEVEL || "info",
    base: { component },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
  return base;
}

export type Logger = ReturnType<typeof createLogger>;
