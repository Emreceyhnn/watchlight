export function requireEnv(names: string[]): void {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(
      `[startup] Missing required environment variable(s): ${missing.join(", ")}`
    );
    process.exit(1);
  }
}
