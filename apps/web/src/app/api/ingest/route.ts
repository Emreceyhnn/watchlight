import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { IngestBatchPayloadSchema, IngestEventPayloadSchema } from "@watchlight/shared";
import { validateApiKey, rateLimit } from "@/lib/rate-limit";
import { lookupGeoCountry, parseRawLog } from "@/lib/normalizer";
import { redis } from "@/lib/redis";

const MAX_BODY_BYTES = 256 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. API Key Doğrulama
    if (!validateApiKey(req)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Geçersiz veya eksik X-API-Key başlığı.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Rate limiting (API key başına)
    const apiKey = req.headers.get("x-api-key")!;
    const limitResult = await rateLimit(`ingest:${apiKey}`, 200, 60);
    if (!limitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: "İstek limiti aşıldı." },
        },
        { status: 429, headers: { "Retry-After": String(limitResult.resetSec) } }
      );
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "İstek gövdesi çok büyük." } },
        { status: 413 }
      );
    }

    const body = await req.json();

    // 3. Ham Log Desteği (raw log formatı gönderilmişse parse et)
    if (body.raw && body.sourceType) {
      const parsed = parseRawLog(body);
      if (!parsed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PARSE_ERROR",
              message: "Ham log ayrıştırılamadı.",
            },
          },
          { status: 400 }
        );
      }

      const validated = IngestEventPayloadSchema.safeParse(parsed);
      if (!validated.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Ayrıştırılan log şema doğrulamasından geçemedi.",
              details: validated.error.flatten(),
            },
          },
          { status: 400 }
        );
      }
      return await processEvents([validated.data]);
    }

    // 3. Batch Event Formatı
    if (Array.isArray(body.events)) {
      const batchResult = IngestBatchPayloadSchema.safeParse(body);
      if (!batchResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Geçersiz batch formatı.",
              details: batchResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }
      return await processEvents(batchResult.data.events);
    }

    // 4. Tekil Event Formatı
    const singleResult = IngestEventPayloadSchema.safeParse(body);
    if (!singleResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Geçersiz event formatı.",
            details: singleResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    return await processEvents([singleResult.data]);
  } catch (error) {
    console.error("[Ingest API] Ingestion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Log alımı sırasında dahili sunucu hatası.",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Event'leri veritabanına kaydeder ve Redis Pub/Sub üzerinden fırlatır
 */
async function processEvents(rawEvents: any[]) {
  const eventsToCreate = rawEvents.map((evt) => ({
    type: evt.type,
    sourceIp: evt.sourceIp,
    destIp: evt.destIp || null,
    sourcePort: evt.sourcePort || null,
    destPort: evt.destPort || null,
    username: evt.username || null,
    userAgent: evt.userAgent || null,
    path: evt.path || null,
    payload: evt.payload || null,
    geoCountry: evt.geoCountry || lookupGeoCountry(evt.sourceIp),
    timestamp: evt.timestamp ? new Date(evt.timestamp) : new Date(),
  }));

  // Veritabanına toplu kayıt
  const created = await prisma.securityEvent.createMany({
    data: eventsToCreate,
  });

  // Redis Pub/Sub üzerinden anlık yayınlama (Faz 8)
  try {
    for (const evt of eventsToCreate) {
      await redis.publish("events:stream", JSON.stringify(evt));
    }
  } catch (err) {
    console.warn("[Ingest API] Redis pub/sub push failed:", err);
  }

  return NextResponse.json({
    success: true,
    data: {
      ingestedCount: created.count,
    },
  });
}
