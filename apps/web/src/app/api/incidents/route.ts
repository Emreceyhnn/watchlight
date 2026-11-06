import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { CreateIncidentInputSchema } from "@watchlight/shared";
import { authenticateRequest } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.response) return auth.response;

  try {
    const incidents = await prisma.incident.findMany({
      include: {
        alert: {
          include: { rule: true },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: incidents });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch incident list." } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req, ["ADMIN", "ANALYST"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const parse = CreateIncidentInputSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid incident data.",
            details: parse.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { alertId, title, summary, assignee, priority } = parse.data;

    const creatorUser = auth.user?.email || auth.user?.name || "SOC Analyst";

    const [incident] = await prisma.$transaction([
      prisma.incident.create({
        data: {
          alertId,
          title,
          summary,
          assignee: assignee || creatorUser,
          priority,
          status: "OPEN",
          timeline: {
            create: {
              actor: creatorUser,
              action: "ASSIGN",
              note: `Incident created by ${creatorUser} and assigned to ${assignee || creatorUser}.`,
            },
          },
        },
        include: {
          alert: { include: { rule: true } },
          timeline: true,
        },
      }),
      prisma.alert.update({
        where: { id: alertId },
        data: { status: "ASSIGNED" },
      }),
    ]);

    return NextResponse.json({ success: true, data: incident }, { status: 201 });
  } catch (error) {
    console.error("[Incident API] Error creating incident:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create incident." } },
      { status: 500 }
    );
  }
}
