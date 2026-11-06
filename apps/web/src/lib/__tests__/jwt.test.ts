import { describe, it, expect, beforeAll, vi } from "vitest";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret-minimum-32-characters-long-key";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-minimum-32-characters-long-key";
});

vi.mock("../redis", () => ({
  redis: {
    get: vi.fn(async (key: string) => null),
    setex: vi.fn(async () => "OK"),
    on: vi.fn(),
  },
}));

import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../jwt";

describe("JWT Authentication & Token Lifecycle", () => {
  const user = {
    userId: "usr_123456",
    email: "analyst@watchlight.soc",
    role: "ANALYST" as const,
    name: "SOC Analyst",
  };

  it("generates a valid accessToken and verifies it successfully", async () => {
    const token = await signAccessToken(user);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const verified = await verifyAccessToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe(user.email);
    expect(verified?.role).toBe("ANALYST");
  });

  it("generates a valid refreshToken with a jti and verifies it", async () => {
    const token = await signRefreshToken(user);
    expect(token).toBeDefined();

    const verified = await verifyRefreshToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe(user.email);
    expect(verified?.jti).toBeDefined();
  });

  it("rejects an invalid or tampered token (returns null)", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
    const verified = await verifyAccessToken(invalidToken);
    expect(verified).toBeNull();
  });
});
