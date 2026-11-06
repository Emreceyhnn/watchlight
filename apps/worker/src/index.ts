import Redis from "ioredis";
import { prisma, Rule, Alert, Severity, EventType } from "@watchlight/db";
import { WATCHLIGHT_VERSION, requireEnv, createLogger } from "@watchlight/shared";

if (process.env.NODE_ENV === "production") {
  requireEnv(["REDIS_URL", "DATABASE_URL"]);
}

const log = createLogger("worker");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const subRedis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });

subRedis.on("error", (err) => log.error({ err }, "SubRedis connection error"));
redis.on("error", (err) => log.error({ err }, "RedisClient connection error"));

interface IngestedEvent {
  type: EventType;
  sourceIp: string;
  destIp?: string | null;
  username?: string | null;
  geoCountry?: string | null;
  timestamp?: string;
  payload?: any;
}

let cachedRules: Rule[] = [];

async function loadRules() {
  try {
    cachedRules = await prisma.rule.findMany({
      where: { enabled: true },
    });
    log.info({ count: cachedRules.length }, "Loaded active detection rules");
  } catch (err) {
    log.error({ err }, "Failed to load rules");
  }
}

async function evaluateEvent(event: IngestedEvent) {
  for (const rule of cachedRules) {
    if (!rule.eventTypes.includes(event.type)) {
      continue;
    }

    if (rule.attackTechnique === "T1078" && event.username) {
      const geoKey = `user:last_geo:${event.username}`;
      const currentCountry = event.geoCountry || "TR";
      const lastCountry = await redis.get(geoKey);

      await redis.setex(geoKey, rule.windowSec, currentCountry);

      if (!lastCountry || lastCountry === currentCountry) {
        continue;
      }
      log.warn(
        { username: event.username, from: lastCountry, to: currentCountry, windowSec: rule.windowSec },
        "Impossible travel detected"
      );
    }

    const isUserBased = rule.attackTechnique === "T1078" && event.username;
    const targetKey = isUserBased ? `user:${event.username}` : `ip:${event.sourceIp}`;
    const windowKey = `window:rule:${rule.id}:${targetKey}`;

    try {
      const count = await redis.incr(windowKey);
      if (count === 1) {
        await redis.expire(windowKey, rule.windowSec);
      }

      if (count >= rule.threshold) {
        await triggerAlert(rule, event, count);
      }
    } catch (err) {
      log.error({ err, rule: rule.name }, "Rule evaluation error");
    }
  }
}

async function triggerAlert(rule: Rule, event: IngestedEvent, currentCount: number) {
  const throttleKey = `throttle:rule:${rule.id}:ip:${event.sourceIp}`;

  const isThrottled = await redis.get(throttleKey);
  if (isThrottled) {
    return;
  }

  log.warn(
    { severity: rule.severity, rule: rule.name, sourceIp: event.sourceIp, count: currentCount },
    "Alert triggered"
  );

  try {
    const newAlert = await prisma.alert.create({
      data: {
        ruleId: rule.id,
        sourceIp: event.sourceIp,
        username: event.username || null,
        eventCount: currentCount,
        severity: rule.severity,
        status: "OPEN",
      },
      include: {
        rule: true,
      },
    });

    await redis.set(throttleKey, "active", "EX", rule.windowSec, "NX");

    await redis.publish("alerts:stream", JSON.stringify(newAlert));
  } catch (err) {
    log.error({ err }, "Failed to persist alert");
    await redis.del(throttleKey).catch(() => {});
  }
}

async function startEngine() {
  log.info({ version: WATCHLIGHT_VERSION }, "Starting Rule Engine");

  await loadRules();

  await subRedis.subscribe("events:stream", "rules:reload");

  subRedis.on("message", async (channel, message) => {
    if (channel === "rules:reload") {
      log.info("Rules reload signal received");
      await loadRules();
      return;
    }

    if (channel === "events:stream") {
      try {
        const event: IngestedEvent = JSON.parse(message);
        await evaluateEvent(event);
      } catch (err) {
        log.error({ err }, "Invalid event JSON on stream");
      }
    }
  });

  log.info("Subscribed to 'events:stream' and 'rules:reload'");

  const hbInterval = setInterval(async () => {
    try {
      await redis.set("worker:heartbeat", Date.now().toString(), "EX", 15);
    } catch (e) {
    }
  }, 5000);

  const shutdown = async (signal: string) => {
    log.info({ signal }, "Received shutdown signal, starting graceful shutdown");
    clearInterval(hbInterval);
    try {
      await subRedis.unsubscribe();
      subRedis.disconnect();
      redis.disconnect();
      await prisma.$disconnect();
      log.info("Cleanup complete, exiting cleanly");
    } catch (err) {
      log.error({ err }, "Error during shutdown");
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startEngine().catch((err) => {
  log.fatal({ err }, "Fatal error in worker");
  process.exit(1);
});
