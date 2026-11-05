import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, signRefreshToken, revokeToken } from "@/lib/jwt";
import { prisma } from "@watchlight/db";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("wl_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Refresh token not found.",
          },
        },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired refresh token.",
          },
        },
        { status: 401 }
      );
    }

    // Kullanıcının veritabanında halen aktif olduğunu doğrula
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not found.",
          },
        },
        { status: 401 }
      );
    }

    // Eski refresh token'ı revoke et (Rotation prensibi)
    if (payload.jti) {
      await revokeToken(payload.jti);
    }

    const newPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const newAccessToken = await signAccessToken(newPayload);
    const newRefreshToken = await signRefreshToken(newPayload);

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: newPayload,
      },
    });

    response.cookies.set("wl_refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 3600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Auth API] Refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Token refresh failed.",
        },
      },
      { status: 500 }
    );
  }
}
