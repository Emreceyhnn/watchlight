import { NextRequest, NextResponse } from "next/server";
import { prisma, Severity } from "@watchlight/db";
import { authenticateRequest } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

interface TopIpStat {
  sourceIp: string;
  count: number;
  geoCountry: string | null;
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.response) return auth.response;

  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const [totalEvents, activeAlerts, criticalAlerts, openIncidents, recentEventsCount] =
      await Promise.all([
        prisma.securityEvent.count(),
        prisma.alert.count({ where: { status: "OPEN" } }),
        prisma.alert.count({ where: { status: "OPEN", severity: "CRITICAL" } }),
        prisma.incident.count({ where: { status: "OPEN" } }),
        prisma.securityEvent.count({ where: { timestamp: { gte: oneMinuteAgo } } }),
      ]);

    // Son 1 saatteki en aktif saldırgan IP'ler
    const topIpsRaw = await prisma.$queryRaw<TopIpStat[]>`
      SELECT "sourceIp", COUNT(*)::int as count, "geoCountry"
      FROM "SecurityEvent"
      WHERE "timestamp" >= NOW() - INTERVAL '1 hour'
      GROUP BY "sourceIp", "geoCountry"
      ORDER BY count DESC
      LIMIT 5;
    `;

    // Severity bazlı dağılım
    const severityGroups = await prisma.alert.groupBy({
      by: ["severity"],
      _count: { severity: true },
    });

    const severityDistribution: Record<Severity, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    severityGroups.forEach((g) => {
      severityDistribution[g.severity] = g._count.severity;
    });

    // Gerçek son 60 saniyelik Event Per Second (EPS)
    const currentEps = Math.max(Math.round(recentEventsCount / 60), recentEventsCount > 0 ? 1 : 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          activeAlerts,
          criticalAlerts,
          openIncidents,
          eps: currentEps,
        },
        topIps: topIpsRaw,
        severityDistribution,
      },
    });
  } catch (error) {
    console.error("[Stats API] Error calculating statistics:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "İstatistikler hesaplanamadı." } },
      { status: 500 }
    );
  }
}
