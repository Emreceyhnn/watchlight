import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { redis } from "./redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSec: number;
}

/**
 * Redis tabanlı Sliding Window / Token Bucket Rate Limiter
 * @param identifier İstemci IP adresi veya API anahtarı
 * @param limit İzin verilen maksimum istek sayısı
 * @param windowSec Zaman penceresi (saniye cinsinden)
 */
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
    // Redis erişilemezse uygulamanın çökmesini engelle (graceful degradation)
    console.warn("[RateLimit] Redis error, allowing request:", error);
    return {
      success: true,
      limit,
      remaining: limit,
      resetSec: windowSec,
    };
  }
}

/**
 * X-API-Key doğrulama yardımcısı (Log toplayıcılar & simülatör için)
 */
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
