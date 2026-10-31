import Redis from "ioredis";
import { prisma, Rule, Alert, Severity, EventType } from "@watchlight/db";
import { WATCHLIGHT_VERSION } from "@watchlight/shared";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const subRedis = new Redis(REDIS_URL);
const redis = new Redis(REDIS_URL);

interface IngestedEvent {
  type: EventType;
  sourceIp: string;
  destIp?: string | null;
  username?: string | null;
  geoCountry?: string | null;
  timestamp?: string;
  payload?: any;
}

// Aktif kural önbelleği
let cachedRules: Rule[] = [];

/**
 * Kuralları veritabanından çekip belleğe alır
 */
async function loadRules() {
  try {
    cachedRules = await prisma.rule.findMany({
      where: { enabled: true },
    });
    console.log(`[Rule Engine] Loaded ${cachedRules.length} active detection rules.`);
  } catch (err) {
    console.error("[Rule Engine] Failed to load rules:", err);
  }
}

/**
 * Sliding Window Aggregation & Eşik Kontrolü
 */
async function evaluateEvent(event: IngestedEvent) {
  for (const rule of cachedRules) {
    if (!rule.eventTypes.includes(event.type)) {
      continue;
    }

    // Anahtar formatı: rule:{ruleId}:source:{sourceIp}
    // Impossible Travel için kullanıcı bazlı: rule:{ruleId}:user:{username}
    const isUserBased = rule.attackTechnique === "T1078" && event.username;
    const targetKey = isUserBased ? `user:${event.username}` : `ip:${event.sourceIp}`;
    const windowKey = `window:rule:${rule.id}:${targetKey}`;

    try {
      const count = await redis.incr(windowKey);
      if (count === 1) {
        await redis.expire(windowKey, rule.windowSec);
      }

      // Eşik aşıldı mı?
      if (count >= rule.threshold) {
        await triggerAlert(rule, event, count);
      }
    } catch (err) {
      console.error(`[Rule Engine] Evaluation error on rule ${rule.name}:`, err);
    }
  }
}

/**
 * Alert Üretimi & Throttle (Deduplication)
 */
async function triggerAlert(rule: Rule, event: IngestedEvent, currentCount: number) {
  // Throttling key: alert çığının önüne geçmek için aynı pencere boyunca 2. alert üretilmez
  const throttleKey = `throttle:rule:${rule.id}:ip:${event.sourceIp}`;
  const isThrottled = await redis.get(throttleKey);

  if (isThrottled) {
    return; // Halihazırda bu kural ve IP için açık bir alarm var
  }

  // Throttle kilidini ayarla (kuralın window süresi kadar)
  await redis.setex(throttleKey, rule.windowSec, "active");

  console.log(
    `🚨 [ALERT TRIGGERED] [${rule.severity}] ${rule.name} -> Target: ${event.sourceIp} (Count: ${currentCount})`
  );

  try {
    // 1. Veritabanına Alert kaydı
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

    // 2. Redis Pub/Sub üzerinden WebSocket sunucusuna alert yayınlama
    await redis.publish("alerts:stream", JSON.stringify(newAlert));
  } catch (err) {
    console.error("[Rule Engine] Failed to persist alert:", err);
  }
}

async function startEngine() {
  console.log(`🛡️ [Watchlight Worker] Starting Rule Engine v${WATCHLIGHT_VERSION}...`);

  await loadRules();

  // Redis kanallarına abone ol
  await subRedis.subscribe("events:stream", "rules:reload");

  subRedis.on("message", async (channel, message) => {
    if (channel === "rules:reload") {
      console.log("[Rule Engine] Rules reload signal received.");
      await loadRules();
      return;
    }

    if (channel === "events:stream") {
      try {
        const event: IngestedEvent = JSON.parse(message);
        await evaluateEvent(event);
      } catch (err) {
        console.error("[Rule Engine] Invalid event JSON on stream:", err);
      }
    }
  });

  console.log("✅ [Rule Engine] Subscribed to 'events:stream' and 'rules:reload'.");
}

startEngine().catch((err) => {
  console.error("❌ Fatal error in worker:", err);
  process.exit(1);
});
