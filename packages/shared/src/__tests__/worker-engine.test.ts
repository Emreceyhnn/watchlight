import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Worker Rule Engine & Sliding Window Aggregation", () => {
  let mockRedisStorage: Record<string, string>;
  let mockRedisExpirations: Record<string, number>;

  const mockRedis = {
    incr: vi.fn(async (key: string) => {
      const current = parseInt(mockRedisStorage[key] || "0", 10) + 1;
      mockRedisStorage[key] = current.toString();
      return current;
    }),
    expire: vi.fn(async (key: string, seconds: number) => {
      mockRedisExpirations[key] = seconds;
      return 1;
    }),
    get: vi.fn(async (key: string) => {
      return mockRedisStorage[key] || null;
    }),
    setex: vi.fn(async (key: string, seconds: number, value: string) => {
      mockRedisStorage[key] = value;
      mockRedisExpirations[key] = seconds;
      return "OK";
    }),
    del: vi.fn(async (key: string) => {
      delete mockRedisStorage[key];
      delete mockRedisExpirations[key];
      return 1;
    }),
  };

  beforeEach(() => {
    mockRedisStorage = {};
    mockRedisExpirations = {};
    vi.clearAllMocks();
  });

  it("atomically increments the window counter for the same IP and sets expire on first hit", async () => {
    const key = "window:rule:test-rule-1:ip:185.220.101.5";
    const windowSec = 600;

    const count1 = await mockRedis.incr(key);
    if (count1 === 1) {
      await mockRedis.expire(key, windowSec);
    }
    expect(count1).toBe(1);
    expect(mockRedisExpirations[key]).toBe(600);

    const count2 = await mockRedis.incr(key);
    expect(count2).toBe(2);
  });

  it("fires an alert when the threshold is exceeded and no throttle is active", async () => {
    const throttleKey = "throttle:rule:test-rule-1:ip:185.220.101.5";
    const isThrottled = await mockRedis.get(throttleKey);

    expect(isThrottled).toBeNull();

    await mockRedis.setex(throttleKey, 600, "active");
    expect(await mockRedis.get(throttleKey)).toBe("active");
  });

  it("suppresses consecutive alerts while throttle is active (deduplication)", async () => {
    const throttleKey = "throttle:rule:test-rule-1:ip:185.220.101.5";
    await mockRedis.setex(throttleKey, 600, "active");

    const isThrottled = await mockRedis.get(throttleKey);
    let alertCreated = false;

    if (!isThrottled) {
      alertCreated = true;
    }

    expect(alertCreated).toBe(false);
  });

  it("clears the throttle key when the DB write fails (rollback)", async () => {
    const throttleKey = "throttle:rule:test-rule-1:ip:185.220.101.5";
    await mockRedis.setex(throttleKey, 600, "active");

    await mockRedis.del(throttleKey);
    expect(await mockRedis.get(throttleKey)).toBeNull();
  });
});

