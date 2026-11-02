import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Güvenlik Başlıkları (Security Headers)
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  // Next.js dev modunda Fast Refresh/HMR runtime'ı eval() kullanır; CSP'yi
  // sadece geliştirme ortamında gevşetiyoruz, production'da katı kalır.
  const scriptSrc =
    process.env.NODE_ENV === "production" ? "script-src 'self'" : "script-src 'self' 'unsafe-eval'";
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; ${scriptSrc}; frame-ancestors 'none'`
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
