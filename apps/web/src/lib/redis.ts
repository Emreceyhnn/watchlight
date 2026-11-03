import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined;
}

export const redis =
  global.redisClient ||
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

redis.on("error", (err) => {
  console.error("[Web:Redis] Connection error:", err.message);
});

if (process.env.NODE_ENV !== "production") {
  global.redisClient = redis;
}
