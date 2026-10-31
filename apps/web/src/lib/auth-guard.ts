import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { UserRole } from "@watchlight/shared";

export async function authenticateRequest(
  req: NextRequest,
  allowedRoles?: UserRole[]
) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Yetkilendirme başlığı (Bearer token) eksik veya hatalı.",
          },
        },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);
  const user = await verifyAccessToken(token);

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Geçersiz veya süresi dolmuş token.",
          },
        },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Bu işlem için yetkiniz bulunmamaktadır.",
          },
        },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}
