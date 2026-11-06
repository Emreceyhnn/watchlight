import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createLogger } from "@watchlight/shared";
import { redis } from "./redis";

const log = createLogger("web:rate-limit");

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSec: number;
}

export async function rateLimit(
  identifier: string,
  limit = 100,
  windowSec = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSec);
    }

    const ttl = await redis.ttl(key);

    if (current > limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        resetSec: ttl > 0 ? ttl : windowSec,
      };
    }

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - current),
      resetSec: ttl > 0 ? ttl : windowSec,
    };
  } catch (error) {
    log.error({ err: error }, "Redis unavailable — rate limiting is DISABLED (fail-open)");
    return {
      success: true,
      limit,
      remaining: limit,
      resetSec: windowSec,
    };
  }
}

export function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get("x-api-key");
  const configuredKey = process.env.INGEST_API_KEY;

  if (!configuredKey) {
    throw new Error("INGEST_API_KEY is required.");
  }
  if (!apiKey) return false;

  const a = Buffer.from(apiKey);
  const b = Buffer.from(configuredKey);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
