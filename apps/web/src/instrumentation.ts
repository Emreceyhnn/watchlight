import { requireEnv } from "@watchlight/shared";

export function register() {
  if (process.env.NODE_ENV === "production") {
    requireEnv([
      "DATABASE_URL",
      "REDIS_URL",
      "JWT_ACCESS_SECRET",
      "JWT_REFRESH_SECRET",
      "INGEST_API_KEY",
    ]);
  }
}
