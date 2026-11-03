import Redis from "ioredis";
import { prisma, Rule, Alert, Severity, EventType } from "@watchlight/db";
import { WATCHLIGHT_VERSION } from "@watchlight/shared";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const subRedis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });

subRedis.on("error", (err) => console.error("[Worker:SubRedis] Redis connection error:", err));
redis.on("error", (err) => console.error("[Worker:RedisClient] Redis connection error:", err));

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

    // Impossible Travel (T1078) için anomali kontrolü: Kullanıcı farklı ülkeden oturum açtı mı?
    if (rule.attackTechnique === "T1078" && event.username) {
      const geoKey = `user:last_geo:${event.username}`;
      const currentCountry = event.geoCountry || "TR";
      const lastCountry = await redis.get(geoKey);

      // Son ülkeyi güncelle (1 saat boyunca sakla)
      await redis.setex(geoKey, rule.windowSec, currentCountry);

      if (!lastCountry || lastCountry === currentCountry) {
        // İlk giriş veya aynı ülke içindeki normal oturum açılışı; Impossible travel tetiklenmez
        continue;
      }
      // Farklı ülkeden giriş tespit edildi:
      console.log(`🚨 [IMPOSSIBLE TRAVEL DETECTED] User: ${event.username} moved from ${lastCountry} to ${currentCountry} within ${rule.windowSec}s!`);
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

  // Atomik NX kontrolü ile Race Condition engelleme
  const isThrottled = await redis.get(throttleKey);
  if (isThrottled) {
    return; // Halihazırda bu kural ve IP için açık bir alarm var
  }

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

    // 2. Throttle kilidini SADECE DB kaydı başarılı olduktan sonra atomik ayarla
    await redis.set(throttleKey, "active", "EX", rule.windowSec, "NX");

    // 3. Redis Pub/Sub üzerinden WebSocket/SSE sunucusuna alert yayınlama
    await redis.publish("alerts:stream", JSON.stringify(newAlert));
  } catch (err) {
    console.error("[Rule Engine] Failed to persist alert:", err);
    // Hata durumunda olası throttle anahtarını temizle
    await redis.del(throttleKey).catch(() => {});
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

  // Worker Heartbeat (every 5 seconds)
  const hbInterval = setInterval(async () => {
    try {
      await redis.set("worker:heartbeat", Date.now().toString(), "EX", 15);
    } catch (e) {
      // Ignore transient errors
    }
  }, 5000);

  // Graceful Shutdown Handlers (SRE FM-03)
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 [Worker] Received ${signal}. Starting graceful shutdown...`);
    clearInterval(hbInterval);
    try {
      await subRedis.unsubscribe();
      subRedis.disconnect();
      redis.disconnect();
      await prisma.$disconnect();
      console.log("✅ [Worker] Cleanup complete. Exiting cleanly.");
    } catch (err) {
      console.error("⚠️ [Worker] Error during shutdown:", err);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startEngine().catch((err) => {
  console.error("❌ Fatal error in worker:", err);
  process.exit(1);
});
