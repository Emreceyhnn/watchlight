import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-guard";
import { redis } from "@/lib/redis";

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
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create ticket." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { ticket } });
}
