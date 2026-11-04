import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";
import { redis as sharedRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events (SSE) Canlı Yayın Gateway'i
 * Tarayıcı EventSource ile tek yönlü ve son derece stabil canlı stream sağlar.
 * EventSource custom header gönderemediğinden, uzun ömürlü access JWT yerine
 * /api/stream/ticket üzerinden alınan 30 saniyelik tek kullanımlık bir ticket
 * query param olarak taşınır. Ticket burada tüketilir (GETDEL) ve bir daha
 * kullanılamaz; URL/proxy log/history'de görünse bile değersizdir.
 */
export async function GET(req: NextRequest) {
  const ticket = req.nextUrl.searchParams.get("ticket");

  if (!ticket) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Geçerli bir bağlantı ticket'ı gereklidir." } },
      { status: 401 }
    );
  }

  let ticketPayload: string | null;
  try {
    ticketPayload = await sharedRedis.getdel(`stream:ticket:${ticket}`);
  } catch (err) {
    console.error("[SSE] Ticket lookup failed:", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Bağlantı doğrulanamadı." } },
      { status: 500 }
    );
  }

  if (!ticketPayload) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Ticket geçersiz veya süresi dolmuş." } },
      { status: 401 }
    );
  }

  const encoder = new TextEncoder();
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const sub = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: null });
  sub.on("error", (err) => {
    console.error("[SSE:RedisSub] Connection error:", err);
  });

  const customStream = new ReadableStream({
    async start(controller) {
      try {
        await sub.connect();
        await sub.subscribe("events:stream", "alerts:stream");

        // Bağlantı açılış mesajı
        controller.enqueue(
          encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "STREAM_CONNECTED" })}\n\n`)
        );

        sub.on("message", (channel, message) => {
          const eventType = channel === "alerts:stream" ? "alert" : "event";
          controller.enqueue(
            encoder.encode(`event: ${eventType}\ndata: ${message}\n\n`)
          );
        });

        // 25 saniyede bir ping/keepalive gönderimi
        const intervalId = setInterval(() => {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        }, 25000);

        req.signal.addEventListener("abort", () => {
          clearInterval(intervalId);
          sub.disconnect();
          controller.close();
        });
      } catch (err) {
        console.error("[SSE Stream] Connection error:", err);
        controller.close();
      }
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Nginx proxy buffering'i devre dışı bırakır
    },
  });
}
