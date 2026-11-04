import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@watchlight/db";
import { LoginInputSchema, createLogger } from "@watchlight/shared";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit";

const log = createLogger("web:auth");

// Sabit zamanlı karşılaştırma için sahte bcrypt hash'i (kullanıcı bulunamadığında timing attack'ı önler)
const DUMMY_HASH = "$2a$10$wN17qGz8W22Gk8fD99uPzeP/aE0z58o7hPj75B0x3JqT2Fw7jVw1q";

export async function POST(req: NextRequest) {
  try {
    // 1. IP bazlı Rate Limiting (5 dakikada en fazla 5 deneme)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rl = await rateLimit(`login:ip:${ip}`, 5, 300);

    if (!rl.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: `Çok fazla başarısız giriş denemesi. Lütfen ${rl.resetSec} saniye sonra tekrar deneyin.`,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": rl.resetSec.toString(),
          },
        }
      );
    }

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

    // 2. Timing attack koruması: Kullanıcı olmasa bile bcrypt.compare çalıştırılır
    const hashToCompare = user ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
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
    log.error({ err: error }, "Login error");
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
