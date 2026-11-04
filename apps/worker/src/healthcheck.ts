import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

async function main() {
  const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true, connectTimeout: 3000 });
  redis.on("error", () => {}); // avoid unhandled error event noise; connect()/get() below surface the failure
  try {
    await redis.connect();
    const hb = await redis.get("worker:heartbeat");
    if (!hb) {
      console.error("[healthcheck] no heartbeat found");
      process.exit(1);
    }
    const age = Date.now() - Number(hb);
    if (age > 15000) {
      console.error(`[healthcheck] heartbeat stale (${age}ms)`);
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error("[healthcheck] error:", err);
    process.exit(1);
  } finally {
    redis.disconnect();
  }
}

main();
