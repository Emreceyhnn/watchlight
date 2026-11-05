import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { authenticateRequest } from "@/lib/auth-guard";
import { EventType, EventTypeEnum } from "@watchlight/shared";

export async function GET(req: NextRequest) {
  // Analist veya Admin yetkisi kontrolü
  const auth = await authenticateRequest(req);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);

    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const cursor = searchParams.get("cursor");
    const sourceIp = searchParams.get("sourceIp");
    const username = searchParams.get("username");
    const type = searchParams.get("type") as EventType | null;
    const country = searchParams.get("country");
    const minutes = searchParams.get("minutes");

    const where: any = {};

    if (sourceIp) where.sourceIp = sourceIp;
    if (username) where.username = username;
    if (type && EventTypeEnum.safeParse(type).success) where.type = type;
    if (country) where.geoCountry = country;

    if (minutes) {
      const pastDate = new Date(Date.now() - parseInt(minutes, 10) * 60 * 1000);
      where.timestamp = { gte: pastDate };
    }

    const events = await prisma.securityEvent.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    });

    let nextCursor: string | null = null;
    if (events.length > limit) {
      const nextItem = events.pop();
      nextCursor = nextItem?.id || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        events,
        nextCursor,
      },
    });
  } catch (error) {
    console.error("[Events API] Query error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while querying events.",
        },
      },
      { status: 500 }
    );
  }
}
