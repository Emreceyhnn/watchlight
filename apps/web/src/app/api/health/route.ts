import { NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const pong = await redis.ping();
    if (pong !== "PONG") {
      throw new Error("Redis ping failed");
    }

    let workerOnline = false;
    try {
      const hb = await redis.get("worker:heartbeat");
      if (hb && Date.now() - parseInt(hb, 10) < 15000) {
        workerOnline = true;
      }
    } catch {
      workerOnline = false;
    }

    return NextResponse.json({
      success: true,
      status: "ok",
      database: "healthy",
      redis: "healthy",
      worker: {
        online: workerOnline,
        status: workerOnline ? "ONLINE" : "OFFLINE",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        error: err.message || "Healthcheck failed",
        worker: { online: false, status: "OFFLINE" },
      },
      { status: 503 }
    );
  }
}
