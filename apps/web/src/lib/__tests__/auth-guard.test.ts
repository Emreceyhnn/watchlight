import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/jwt", () => ({
  verifyAccessToken: vi.fn(),
}));

import { verifyAccessToken } from "@/lib/jwt";
import { authenticateRequest } from "../auth-guard";

const verifyMock = vi.mocked(verifyAccessToken);

function makeRequest(authorization?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authorization !== undefined) headers.Authorization = authorization;
  return new NextRequest("http://localhost/api/test", { headers });
}

const analyst = {
  userId: "usr_1",
  email: "analyst@watchlight.soc",
  role: "ANALYST" as const,
  name: "SOC Analyst",
};

describe("authenticateRequest", () => {
  beforeEach(() => {
    verifyMock.mockReset();
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const result = await authenticateRequest(makeRequest());

    expect(result.user).toBeNull();
    expect(result.response?.status).toBe(401);
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the header is not a Bearer token", async () => {
    const result = await authenticateRequest(makeRequest("Basic abc123"));

    expect(result.user).toBeNull();
    expect(result.response?.status).toBe(401);
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the token fails verification", async () => {
    verifyMock.mockResolvedValueOnce(null);

    const result = await authenticateRequest(makeRequest("Bearer bad-token"));

    expect(verifyMock).toHaveBeenCalledWith("bad-token");
    expect(result.user).toBeNull();
    expect(result.response?.status).toBe(401);
  });

  it("returns the user when the token is valid and no roles are restricted", async () => {
    verifyMock.mockResolvedValueOnce(analyst);

    const result = await authenticateRequest(makeRequest("Bearer good-token"));

    expect(result.response).toBeNull();
    expect(result.user).toEqual(analyst);
  });

  it("returns the user when the role is in the allowed list", async () => {
    verifyMock.mockResolvedValueOnce(analyst);

    const result = await authenticateRequest(makeRequest("Bearer good-token"), ["ANALYST", "ADMIN"]);

    expect(result.response).toBeNull();
    expect(result.user).toEqual(analyst);
  });

  it("returns 403 when the role is not in the allowed list", async () => {
    verifyMock.mockResolvedValueOnce(analyst);

    const result = await authenticateRequest(makeRequest("Bearer good-token"), ["ADMIN"]);

    expect(result.user).toBeNull();
    expect(result.response?.status).toBe(403);
  });
});
