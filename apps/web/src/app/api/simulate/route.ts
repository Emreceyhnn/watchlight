import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-guard";

/**
 * Dashboard'daki simülasyon tetikleyicisi için sunucu-taraflı köprü.
 * Gerçek INGEST_API_KEY tarayıcıya hiç gönderilmez; burada eklenir.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req, ["ADMIN", "ANALYST"]);
  if (auth.response) return auth.response;

  const ingestApiKey = process.env.INGEST_API_KEY;
  if (!ingestApiKey) {
    console.error("[Simulate API] INGEST_API_KEY is not configured.");
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Simülasyon servisi yapılandırılmamış." } },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const res = await fetch(`${appUrl}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ingestApiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[Simulate API] Proxy error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Simülasyon tetiklenemedi." } },
      { status: 500 }
    );
  }
}
