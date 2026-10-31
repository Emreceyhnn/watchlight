import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, revokeToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("wl_refresh_token")?.value;

    if (refreshToken) {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload?.jti) {
        await revokeToken(payload.jti);
      }
    }

    const response = NextResponse.json({
      success: true,
      data: { message: "Oturum başarıyla kapatıldı." },
    });

    response.cookies.delete("wl_refresh_token");

    return response;
  } catch (error) {
    console.error("[Auth API] Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Çıkış yapılırken bir sorun oluştu.",
        },
      },
      { status: 500 }
    );
  }
}
