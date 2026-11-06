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

async function simulateBruteForce() {
  const attackerIp = ATTACKER_IPS[0];
  console.log(`\n🚨 [Scenario] Starting SSH brute-force attack (IP: ${attackerIp})...`);
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
  console.log(`✅ [Scenario] Sent 8 failed login attempts (should trigger T1110.001).`);
}

async function simulatePortScan() {
  const attackerIp = ATTACKER_IPS[1];
  console.log(`\n🔍 [Scenario] Starting network reconnaissance / port scan (IP: ${attackerIp})...`);
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
  console.log(`✅ [Scenario] Sent 12 SYN port-scan packets (should trigger T1046).`);
}

async function simulateDataExfiltration() {
  const attackerIp = ATTACKER_IPS[2];
  console.log(`\n💾 [Scenario] Starting data exfiltration (IP: ${attackerIp})...`);
  const batch: IngestEventPayload[] = [
    {
      timestamp: new Date().toISOString(),
      type: "DATA_TRANSFER",
      sourceIp: attackerIp,
      destIp: "45.33.32.156",
      username: "analyst_emre",
      geoCountry: COUNTRIES[attackerIp] || "IR",
      payload: {
        bytesTransferred: 52428800,
        protocol: "HTTPS",
        destinationDomain: "cloud-drop-exfil.org",
        file: "database_dump_2026.sql.gz",
      },
    },
  ];

  await sendBatch(batch);
  console.log(`✅ [Scenario] Sent a suspicious 50MB data transfer (should trigger T1048).`);
}

async function simulateImpossibleTravel() {
  console.log(`\n✈️ [Scenario] Simulating impossible-travel anomaly...`);
  const user = "analyst_emre";

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
  console.log(`✅ [Scenario] Generated a TR -> CN login event pair 2 minutes apart.`);
}

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

async function main() {
  console.log(`=======================================================`);
  console.log(`🛡️ WATCHLIGHT ATTACK TRAFFIC SIMULATOR v${WATCHLIGHT_VERSION}`);
  console.log(`Target endpoint: ${INGEST_URL}`);
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
        console.log(`Unknown scenario: ${scenarioName}. Options: bruteforce, portscan, exfil, travel`);
    }
    process.exit(0);
  }

  console.log(`[Simulator] Continuous background traffic and periodic attack simulation started...`);
  console.log(`[Simulator] Press Ctrl+C to stop.\n`);

  setInterval(() => {
    generateBackgroundNoise();
  }, 3000);

  const scenarios = [simulateBruteForce, simulatePortScan, simulateDataExfiltration, simulateImpossibleTravel];
  setInterval(() => {
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    randomScenario();
  }, 30000);

  setTimeout(() => {
    simulateBruteForce();
  }, 2000);
}

main().catch(console.error);
