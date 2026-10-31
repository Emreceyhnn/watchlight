import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { authenticateRequest } from "@/lib/auth-guard";
import { CreateRuleInputSchema } from "@watchlight/shared";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.response) return auth.response;

  try {
    const rules = await prisma.rule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Kurallar alınamadı." } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req, ["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const parse = CreateRuleInputSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Geçersiz kural parametreleri.",
            details: parse.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const newRule = await prisma.rule.create({
      data: parse.data,
    });

    // Worker'a kural yenileme mesajı gönder
    await redis.publish("rules:reload", "1");

    return NextResponse.json({ success: true, data: newRule }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Kural oluşturulamadı." } },
      { status: 500 }
    );
  }
}
