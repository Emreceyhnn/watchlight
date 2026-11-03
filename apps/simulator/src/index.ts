import dotenv from "dotenv";
import { WATCHLIGHT_VERSION, IngestEventPayload } from "@watchlight/shared";

dotenv.config();

const INGEST_URL = process.env.INGEST_URL || "http://localhost:3000/api/ingest";
if (!process.env.INGEST_API_KEY) {
  throw new Error("INGEST_API_KEY is required.");
}
const API_KEY: string = process.env.INGEST_API_KEY;

interface SimulationScenario {
  name: string;
  description: string;
  attackTechnique: string;
  run: () => Promise<void>;
}

// Rastgele IP ve Kullanıcı Havuzu
const NORMAL_IPS = ["192.168.1.10", "192.168.1.25", "10.0.0.15", "10.0.0.42", "88.241.12.8"];
const ATTACKER_IPS = ["185.220.101.5", "45.154.255.89", "194.26.29.112", "91.240.118.17"];
const USERS = ["admin", "root", "analyst_emre", "devops", "john.doe", "service-account"];
const COUNTRIES: Record<string, string> = {
  "185.220.101.5": "RU",
  "45.154.255.89": "CN",
  "194.26.29.112": "IR",
  "91.240.118.17": "KP",
  "88.241.12.8": "TR",
  "192.168.1.10": "TR",
  "10.0.0.15": "US",
};

async function sendBatch(events: IngestEventPayload[]) {
  try {
    const res = await fetch(INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({ events }),
    });

    if (!res.ok) {
      console.error(`[Simulator] Batch send failed: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`[Simulator] Network error sending events: ${err.message}`);
    return false;
  }
}

/**
 * Senaryo 1: SSH / Auth Password Spraying & Brute Force (T1110.001)
 */
async function simulateBruteForce() {
  const attackerIp = ATTACKER_IPS[0];
  console.log(`\n🚨 [Senaryo] SSH Brute Force Saldırısı başlatılıyor (IP: ${attackerIp})...`);
  const batch: IngestEventPayload[] = [];
  
  for (let i = 0; i < 8; i++) {
    batch.push({
      timestamp: new Date(Date.now() - (8 - i) * 1000).toISOString(),
      type: "AUTH_FAILED",
      sourceIp: attackerIp,
      destIp: "192.168.1.100",
      username: "root",
      geoCountry: COUNTRIES[attackerIp] || "RU",
      payload: { service: "sshd", port: 22, reason: "invalid credentials", attempt: i + 1 },
    });
  }

  await sendBatch(batch);
  console.log(`✅ [Senaryo] 8 başarısız giriş denemesi gönderildi (T1110.001 tetiklenmeli).`);
}

/**
 * Senaryo 2: Port & Network Reconnaissance Scan (T1046)
 */
async function simulatePortScan() {
  const attackerIp = ATTACKER_IPS[1];
  console.log(`\n🔍 [Senaryo] Network Reconnaissance / Port Scan başlatılıyor (IP: ${attackerIp})...`);
  const targetPorts = [21, 22, 23, 25, 80, 443, 3389, 8080, 8443, 9200, 27017, 5432];
  const batch: IngestEventPayload[] = targetPorts.map((port, idx) => ({
    timestamp: new Date(Date.now() - (targetPorts.length - idx) * 500).toISOString(),
    type: "NETWORK_SCAN",
    sourceIp: attackerIp,
    destIp: "192.168.1.1",
    geoCountry: COUNTRIES[attackerIp] || "CN",
    payload: { targetPort: port, flags: "SYN", tool: "nmap/7.94" },
  }));

  await sendBatch(batch);
  console.log(`✅ [Senaryo] 12 port SYN tarama paketi gönderildi (T1046 tetiklenmeli).`);
}

/**
 * Senaryo 3: Data Exfiltration via Encrypted Channel (T1048)
 */
async function simulateDataExfiltration() {
  const attackerIp = ATTACKER_IPS[2];
  console.log(`\n💾 [Senaryo] Veri Sızıntısı / Exfiltration başlatılıyor (IP: ${attackerIp})...`);
  const batch: IngestEventPayload[] = [
    {
      timestamp: new Date().toISOString(),
      type: "DATA_TRANSFER",
      sourceIp: attackerIp,
      destIp: "45.33.32.156",
      username: "analyst_emre",
      geoCountry: COUNTRIES[attackerIp] || "IR",
      payload: {
        bytesTransferred: 52428800, // 50 MB
        protocol: "HTTPS",
        destinationDomain: "cloud-drop-exfil.org",
        file: "database_dump_2026.sql.gz",
      },
    },
  ];

  await sendBatch(batch);
  console.log(`✅ [Senaryo] 50MB boyutta şüpheli veri aktarımı gönderildi (T1048 tetiklenmeli).`);
}

/**
 * Senaryo 4: Impossible Travel Anomaly
 */
async function simulateImpossibleTravel() {
  console.log(`\n✈️ [Senaryo] Impossible Travel Anomalisı simüle ediliyor...`);
  const user = "analyst_emre";

  // 1. İstanbul'dan giriş
  await sendBatch([
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: "AUTH_LOGIN",
      sourceIp: "88.241.12.8",
      geoCountry: "TR",
      username: user,
      payload: { city: "Istanbul", userAgent: "Mozilla/5.0 Mac" },
    },
  ]);

  // 2. 2 dakika sonra Hong Kong'dan giriş
  await sendBatch([
    {
      timestamp: new Date().toISOString(),
      type: "AUTH_LOGIN",
      sourceIp: "45.154.255.89",
      geoCountry: "CN",
      username: user,
      payload: { city: "Hong Kong", userAgent: "Mozilla/5.0 Linux" },
    },
  ]);
  console.log(`✅ [Senaryo] 2 dakika arayla TR -> CN login event'i üretildi.`);
}

/**
 * Rastgele Arka Plan SOC Trafiği Jeneratörü
 */
async function generateBackgroundNoise() {
  const eventTypes: IngestEventPayload["type"][] = [
    "AUTH_LOGIN",
    "NETWORK_CONNECT",
    "API_CALL",
    "FILE_ACCESS",
  ];

  const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const randomIp = NORMAL_IPS[Math.floor(Math.random() * NORMAL_IPS.length)];
  const randomUser = USERS[Math.floor(Math.random() * USERS.length)];

  await sendBatch([
    {
      timestamp: new Date().toISOString(),
      type: randomType,
      sourceIp: randomIp,
      username: randomUser,
      geoCountry: COUNTRIES[randomIp] || "TR",
      payload: {
        status: 200,
        latencyMs: Math.floor(Math.random() * 45) + 5,
        userAgent: "Internal SOC Agent v1.0",
      },
    },
  ]);
}

/**
 * Ana döngü
 */
async function main() {
  console.log(`=======================================================`);
  console.log(`🛡️ WATCHLIGHT ATTACK TRAFFIC SIMULATOR v${WATCHLIGHT_VERSION}`);
  console.log(`Hedef Endpoint: ${INGEST_URL}`);
  console.log(`=======================================================\n`);

  const arg = process.argv[2];

  if (arg === "--scenario") {
    const scenarioName = process.argv[3];
    switch (scenarioName) {
      case "bruteforce":
        await simulateBruteForce();
        break;
      case "portscan":
        await simulatePortScan();
        break;
      case "exfil":
        await simulateDataExfiltration();
        break;
      case "travel":
        await simulateImpossibleTravel();
        break;
      default:
        console.log(`Bilinmeyen senaryo: ${scenarioName}. Seçenekler: bruteforce, portscan, exfil, travel`);
    }
    process.exit(0);
  }

  console.log(`[Simulator] Sürekli arka plan trafiği ve periyodik saldırı simülasyonu başlatıldı...`);
  console.log(`[Simulator] Durdurmak için Ctrl+C tuşlayın.\n`);

  // Her 3 saniyede 1 normal arka plan trafiği
  setInterval(() => {
    generateBackgroundNoise();
  }, 3000);

  // Her 30 saniyede bir rastgele bir saldırı senaryosu
  const scenarios = [simulateBruteForce, simulatePortScan, simulateDataExfiltration, simulateImpossibleTravel];
  setInterval(() => {
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    randomScenario();
  }, 30000);

  // İlk açılışta hemen bir brute force fırlat
  setTimeout(() => {
    simulateBruteForce();
  }, 2000);
}

main().catch(console.error);
