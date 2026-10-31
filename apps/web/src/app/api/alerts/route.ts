import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { authenticateRequest } from "@/lib/auth-guard";
import { AlertStatusEnum, SeverityEnum } from "@watchlight/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const where: any = {};
    if (status && AlertStatusEnum.safeParse(status).success) where.status = status;
    if (severity && SeverityEnum.safeParse(severity).success) where.severity = severity;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        rule: true,
        incident: true,
      },
      orderBy: { triggeredAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Alarmlar alınamadı." } },
      { status: 500 }
    );
  }
}
