import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Traceable Request ID oluştur
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  // Güvenlik Başlıkları (Security Headers)
  const response = NextResponse.next();
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com";
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; connect-src 'self' wss: ws: https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; ${scriptSrc}; frame-ancestors 'none'`
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
