import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-guard";
import { redis } from "@/lib/redis";

/**
 * Kısa ömürlü, tek kullanımlık SSE bağlantı ticket'ı.
 * EventSource custom header gönderemediği için access token'ı URL'e koymak
 * yerine, burada normal auth ile (cookie/header) doğrulanmış kullanıcı için
 * Redis'te 30 saniyelik tek kullanımlık bir ticket üretilir. /api/stream bu
 * ticket'ı tüketip siler; URL'de uzun ömürlü bir JWT taşınmaz.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.response) return auth.response;

  const ticket = crypto.randomUUID();
  const key = `stream:ticket:${ticket}`;

  try {
    await redis.setex(key, 30, JSON.stringify(auth.user));
  } catch (err) {
    console.error("[StreamTicket] Redis error:", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Ticket oluşturulamadı." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { ticket } });
}
