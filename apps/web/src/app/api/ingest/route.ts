import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { IngestBatchPayloadSchema, IngestEventPayloadSchema, lookupGeoCountry, parseRawLog, createLogger } from "@watchlight/shared";
import { validateApiKey, rateLimit } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";

const log = createLogger("web:ingest");
const MAX_BODY_BYTES = 256 * 1024;

export async function POST(req: NextRequest) {
  try {
    if (!validateApiKey(req)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid X-API-Key header.",
          },
        },
        { status: 401 }
      );
    }

    const apiKey = req.headers.get("x-api-key")!;
    const limitResult = await rateLimit(`ingest:${apiKey}`, 3000, 60);
    if (!limitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: "Request rate limit exceeded." },
        },
        { status: 429, headers: { "Retry-After": String(limitResult.resetSec) } }
      );
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." } },
        { status: 413 }
      );
    }

    let rawText = "";
    if (req.body) {
      const reader = req.body.getReader();
      let totalBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > MAX_BODY_BYTES) {
            return NextResponse.json(
              { success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the 256KB limit." } },
              { status: 413 }
            );
          }
          chunks.push(value);
        }
      }
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      rawText = new TextDecoder().decode(combined);
    }

    const body = rawText ? JSON.parse(rawText) : {};

    if (body.raw && body.sourceType) {
      const parsed = parseRawLog(body);
      if (!parsed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PARSE_ERROR",
              message: "Failed to parse raw log.",
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
              message: "Parsed log failed schema validation.",
              details: validated.error.flatten(),
            },
          },
          { status: 400 }
        );
      }
      return await processEvents([validated.data]);
    }

    if (Array.isArray(body.events)) {
      const batchResult = IngestBatchPayloadSchema.safeParse(body);
      if (!batchResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid batch format.",
              details: batchResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }
      return await processEvents(batchResult.data.events);
    }

    const singleResult = IngestEventPayloadSchema.safeParse(body);
    if (!singleResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid event format.",
            details: singleResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    return await processEvents([singleResult.data]);
  } catch (error) {
    log.error({ err: error }, "Ingestion error");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error while ingesting log.",
        },
      },
      { status: 500 }
    );
  }
}

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

  const created = await prisma.securityEvent.createMany({
    data: eventsToCreate,
  });

  try {
    if (eventsToCreate.length > 0) {
      const pipe = redis.pipeline();
      for (const evt of eventsToCreate) {
        pipe.publish("events:stream", JSON.stringify(evt));
      }
      await pipe.exec();
    }
  } catch (err) {
    log.warn({ err }, "Redis pub/sub push failed");
  }

  return NextResponse.json({
    success: true,
    data: {
      ingestedCount: created.count,
    },
  });
}
