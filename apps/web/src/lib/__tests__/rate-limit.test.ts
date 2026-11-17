import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../redis", () => ({
  redis: {
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  },
}));

import { redis } from "../redis";
import { rateLimit, validateApiKey } from "../rate-limit";

const incrMock = vi.mocked(redis.incr);
const expireMock = vi.mocked(redis.expire);
const ttlMock = vi.mocked(redis.ttl);

describe("rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows the request and sets the window expiry on the first hit", async () => {
    incrMock.mockResolvedValueOnce(1);
    ttlMock.mockResolvedValueOnce(60);

    const result = await rateLimit("ip:1.2.3.4", 10, 60);

    expect(incrMock).toHaveBeenCalledWith("ratelimit:ip:1.2.3.4");
    expect(expireMock).toHaveBeenCalledWith("ratelimit:ip:1.2.3.4", 60);
    expect(result).toEqual({ success: true, limit: 10, remaining: 9, resetSec: 60 });
  });

  it("does not reset the expiry on later hits within the window", async () => {
    incrMock.mockResolvedValueOnce(5);
    ttlMock.mockResolvedValueOnce(30);

    const result = await rateLimit("ip:1.2.3.4", 10, 60);

    expect(expireMock).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, limit: 10, remaining: 5, resetSec: 30 });
  });

  it("blocks the request once the count exceeds the limit", async () => {
    incrMock.mockResolvedValueOnce(11);
    ttlMock.mockResolvedValueOnce(20);

    const result = await rateLimit("ip:1.2.3.4", 10, 60);

    expect(result).toEqual({ success: false, limit: 10, remaining: 0, resetSec: 20 });
  });

  it("fails open when redis is unavailable", async () => {
    incrMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const result = await rateLimit("ip:1.2.3.4", 10, 60);

    expect(result).toEqual({ success: true, limit: 10, remaining: 10, resetSec: 60 });
  });
});

describe("validateApiKey", () => {
  const ORIGINAL_KEY = process.env.INGEST_API_KEY;

  beforeEach(() => {
    process.env.INGEST_API_KEY = "secret-ingest-key";
  });

  afterEach(() => {
    process.env.INGEST_API_KEY = ORIGINAL_KEY;
  });

  const requestWith = (key?: string) =>
    new NextRequest("http://localhost/api/ingest", {
      headers: key === undefined ? {} : { "x-api-key": key },
    });

  it("accepts the configured key", () => {
    expect(validateApiKey(requestWith("secret-ingest-key"))).toBe(true);
  });

  it("rejects a missing key", () => {
    expect(validateApiKey(requestWith())).toBe(false);
  });

  it("rejects a wrong key of the same length", () => {
    expect(validateApiKey(requestWith("secret-ingest-kex"))).toBe(false);
  });

  it("rejects a key of a different length", () => {
    expect(validateApiKey(requestWith("short"))).toBe(false);
  });

  it("throws when the server has no configured key", () => {
    delete process.env.INGEST_API_KEY;

    expect(() => validateApiKey(requestWith("anything"))).toThrow("INGEST_API_KEY is required.");
  });
});
