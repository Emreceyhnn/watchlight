import Redis from "ioredis";
import { createLogger } from "@watchlight/shared";

const log = createLogger("web:redis");
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
  log.error({ err: err.message }, "Connection error");
});

if (process.env.NODE_ENV !== "production") {
  global.redisClient = redis;
}
