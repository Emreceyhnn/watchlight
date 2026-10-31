import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { LoginInputSchema } from "@watchlight/shared";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = LoginInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Geçersiz e-posta veya parola formatı.",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Hatalı kimlik bilgileri.",
          },
        },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Hatalı kimlik bilgileri.",
          },
        },
        { status: 401 }
      );
    }

    const userPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = await signAccessToken(userPayload);
    const refreshToken = await signRefreshToken(userPayload);

    const response = NextResponse.json({
      success: true,
      data: {
        user: userPayload,
        accessToken,
      },
    });

    // Refresh token HTTP-Only Cookie olarak kaydedilir
    response.cookies.set("wl_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 3600, // 7 gün
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Auth API] Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Sunucu hatası oluştu.",
        },
      },
      { status: 500 }
    );
  }
}
