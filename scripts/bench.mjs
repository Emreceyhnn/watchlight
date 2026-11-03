/**
 * Watchlight Yüksek Performanslı Ingestion Benchmark Betiği
 * 10,000 Event / Saniyede EPS ve Gecikme Ölçümü
 */

const INGEST_URL = process.env.INGEST_URL || "http://localhost:3000/api/ingest";
if (!process.env.INGEST_API_KEY) {
  console.error("INGEST_API_KEY is required (set it in your .env).");
  process.exit(1);
}
const API_KEY = process.env.INGEST_API_KEY;
const TOTAL_EVENTS = 10000;
const BATCH_SIZE = 250; // Her HTTP isteğinde 250 event
const CONCURRENCY = 4; // Eşzamanlı 4 worker pipeline

console.log(`=======================================================`);
console.log(`🚀 WATCHLIGHT INGESTION & PIPELINE BENCHMARK`);
console.log(`Hedef URL: ${INGEST_URL}`);
console.log(`Toplam Event: ${TOTAL_EVENTS.toLocaleString()} | Batch Boyutu: ${BATCH_SIZE} | Paralellik: ${CONCURRENCY}`);
console.log(`=======================================================\n`);

function generateMockBatch(size) {
  const types = ["AUTH_LOGIN", "NETWORK_CONNECT", "API_CALL", "FILE_ACCESS", "AUTH_FAILED"];
  const ips = ["192.168.1.50", "10.0.0.12", "172.16.0.4", "185.220.101.5", "45.154.255.89"];
  const users = ["analyst_emre", "service_worker", "admin", "devops"];

  const events = [];
  for (let i = 0; i < size; i++) {
    events.push({
      timestamp: new Date().toISOString(),
      type: types[i % types.length],
      sourceIp: ips[i % ips.length],
      destIp: "10.0.0.1",
      username: users[i % users.length],
      geoCountry: "TR",
      payload: {
        benchIndex: i,
        status: 200,
        latencyMs: 12,
      },
    });
  }
  return events;
}

async function sendBatch(events) {
  const start = performance.now();
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({ events }),
  });
  const duration = performance.now() - start;

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return duration;
}

async function runBenchmark() {
  const totalBatches = Math.ceil(TOTAL_EVENTS / BATCH_SIZE);
  let completedBatches = 0;
  let errorCount = 0;
  const latencies = [];

  const startTime = performance.now();

  const worker = async () => {
    while (completedBatches < totalBatches) {
      const currentBatchIdx = completedBatches++;
      const currentBatchSize = Math.min(
        BATCH_SIZE,
        TOTAL_EVENTS - currentBatchIdx * BATCH_SIZE
      );

      if (currentBatchSize <= 0) break;

      const events = generateMockBatch(currentBatchSize);

      try {
        const lat = await sendBatch(events);
        latencies.push(lat);
      } catch (err) {
        errorCount += currentBatchSize;
      }
    }
  };

  // Paralel worker'ları başlat
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const totalTimeSeconds = (performance.now() - startTime) / 1000;
  const successfulEvents = TOTAL_EVENTS - errorCount;
  const eps = Math.round(successfulEvents / totalTimeSeconds);

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)]?.toFixed(2) || "0";
  const p95 = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(2) || "0";
  const p99 = latencies[Math.floor(latencies.length * 0.99)]?.toFixed(2) || "0";

  console.log(`\n================ BENCHMARK SONUÇLARI ================`);
  console.log(`✅ İşlenen Toplam Olay  : ${successfulEvents.toLocaleString()} / ${TOTAL_EVENTS.toLocaleString()}`);
  console.log(`⏱️ Toplam Geçen Süre     : ${totalTimeSeconds.toFixed(2)} saniye`);
  console.log(`🔥 Ortalama Throughput   : ${eps.toLocaleString()} Event / Saniye (EPS)`);
  console.log(`📊 Gecikme (Batch p50)   : ${p50} ms`);
  console.log(`📊 Gecikme (Batch p95)   : ${p95} ms`);
  console.log(`📊 Gecikme (Batch p99)   : ${p99} ms`);
  console.log(`⚠️ Hatalı / Düşen Paket  : ${errorCount}`);
  console.log(`======================================================\n`);
}

runBenchmark().catch(console.error);
