import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { UserRole } from "@watchlight/shared";
import { redis } from "./redis";

function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} is required and must be at least 32 characters.`);
  }
  return value;
}

// Lazy + memoize: Next.js build-time "collect page data" aşamasında route
// modülleri import edilir ama runtime env henüz yüklü olmayabilir; secret'lar
// bu yüzden module-load anında değil, ilk gerçek kullanımda doğrulanır.
let accessSecretCache: Uint8Array | null = null;
let refreshSecretCache: Uint8Array | null = null;

function getAccessSecret(): Uint8Array {
  if (!accessSecretCache) {
    accessSecretCache = new TextEncoder().encode(requireSecret("JWT_ACCESS_SECRET"));
  }
  return accessSecretCache;
}

function getRefreshSecret(): Uint8Array {
  if (!refreshSecretCache) {
    refreshSecretCache = new TextEncoder().encode(requireSecret("JWT_REFRESH_SECRET"));
  }
  return refreshSecretCache;
}

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string | null;
}

export async function signAccessToken(payload: AuthUserPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m") // 15 dakika geçerlilik
    .sign(getAccessSecret());
}

export async function signRefreshToken(payload: AuthUserPayload): Promise<string> {
  const jti = crypto.randomUUID();
  return await new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7 gün geçerlilik
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string): Promise<AuthUserPayload | null> {
  const secret = getAccessSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      name: payload.name as string | null,
    };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<(AuthUserPayload & { jti?: string }) | null> {
  const secret = getRefreshSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    const jti = payload.jti as string | undefined;

    // Denylist kontrolü (logout veya iptal edilmiş refresh token)
    // Güvenlik Kuralı: Fail-Closed olmalıdır. Redis'e erişilemezse token reddedilir.
    if (jti) {
      try {
        const isRevoked = await redis.get(`denylist:token:${jti}`);
        if (isRevoked) return null;
      } catch (err) {
        console.error("[CRITICAL AUTH ERROR] Redis denylist check failed. Failing closed for safety:", err);
        return null; // Fail-closed: Doğrulanamayan token yetkilendirilmez
      }
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      name: payload.name as string | null,
      jti,
    };
  } catch {
    return null;
  }
}

export async function revokeToken(jti: string, ttlSeconds = 7 * 24 * 3600): Promise<void> {
  try {
    await redis.setex(`denylist:token:${jti}`, ttlSeconds, "revoked");
  } catch (err) {
    console.error("[Auth] Token revocation failed in Redis:", err);
  }
}
