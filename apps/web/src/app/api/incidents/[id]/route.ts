import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { authenticateRequest } from "@/lib/auth-guard";
import { z } from "zod";

const UpdateIncidentSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "MITIGATED", "CLOSED"]).optional(),
  priority: z.enum(["P1", "P2", "P3", "P4"]).optional(),
  assignee: z.string().min(1).max(256).optional(),
  note: z.string().max(2000).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req, ["ADMIN", "ANALYST", "VIEWER"]);
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        alert: { include: { rule: true } },
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!incident) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Olay kaydı bulunamadı.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Olay detayı alınamadı." },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req, ["ADMIN", "ANALYST"]);
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const parse = UpdateIncidentSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Geçersiz güncelleme parametreleri.",
            details: parse.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { status, priority, assignee, note } = parse.data;
    const actorUser = auth.user?.email || auth.user?.name || "SOC Analyst";

    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Olay bulunamadı." } },
        { status: 404 }
      );
    }

    const timelineActions: any[] = [];
    if (status && status !== existing.status) {
      timelineActions.push({
        actor: actorUser,
        action: "STATUS_CHANGE",
        note: `Durum güncellendi: ${existing.status} -> ${status}. ${note || ""}`.trim(),
      });
    }
    if (assignee && assignee !== existing.assignee) {
      timelineActions.push({
        actor: actorUser,
        action: "ASSIGN",
        note: `Yeni atama yapıldı: ${assignee}. ${note || ""}`.trim(),
      });
    }
    if (note && timelineActions.length === 0) {
      timelineActions.push({
        actor: actorUser,
        action: "COMMENT",
        note,
      });
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(assignee ? { assignee } : {}),
        ...(timelineActions.length > 0
          ? {
              timeline: {
                create: timelineActions,
              },
            }
          : {}),
      },
      include: {
        alert: { include: { rule: true } },
        timeline: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Olay güncellenemedi." } },
      { status: 500 }
    );
  }
}

