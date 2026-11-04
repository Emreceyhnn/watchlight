/**
 * Fail-fast startup check: crashes immediately with a clear message if a
 * required env var is missing, instead of silently falling back to a
 * dev default (e.g. REDIS_URL defaulting to localhost inside a container).
 */
export function requireEnv(names: string[]): void {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(
      `[startup] Missing required environment variable(s): ${missing.join(", ")}`
    );
    process.exit(1);
  }
}
