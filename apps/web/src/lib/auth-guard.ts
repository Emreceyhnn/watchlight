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
            message: "Missing or invalid Authorization header (Bearer token).",
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
            message: "Invalid or expired token.",
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
            message: "You are not authorized to perform this action.",
          },
        },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}
