import { PrismaClient, Role, Severity, EventType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Watchlight database...");

  const isProd = process.env.NODE_ENV === "production";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const analystPassword = process.env.SEED_ANALYST_PASSWORD;

  if (isProd && (!adminPassword || !analystPassword)) {
    throw new Error(
      "SEED_ADMIN_PASSWORD and SEED_ANALYST_PASSWORD are required in production."
    );
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword || "Admin123*!", 10);
  const analystPasswordHash = await bcrypt.hash(analystPassword || "Analyst123*!", 10);

  if (!isProd) {
    console.warn(
      "⚠️  Development mode: using default demo passwords. Set SEED_ADMIN_PASSWORD / SEED_ANALYST_PASSWORD in production."
    );
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@watchlight.local" },
    update: {},
    create: {
      email: "admin@watchlight.local",
      name: "SOC Lead Admin",
      role: Role.ADMIN,
      password: adminPasswordHash,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@watchlight.local" },
    update: {},
    create: {
      email: "analyst@watchlight.local",
      name: "Security Analyst",
      role: Role.ANALYST,
      password: analystPasswordHash,
    },
  });

  console.log(`👤 Users seeded: ${admin.email}, ${analyst.email}`);

  const defaultRules = [
    {
      name: "Brute Force Attack",
      description: "5 or more failed login attempts from a single source IP within 10 minutes.",
      eventTypes: [EventType.AUTH_FAILED],
      windowSec: 600,
      threshold: 5,
      severity: Severity.HIGH,
      attackTactic: "Credential Access",
      attackTechnique: "T1110.001",
      attackName: "Password Guessing",
    },
    {
      name: "Credential Stuffing",
      description: "More than 10 failed logins from the same source IP targeting different usernames.",
      eventTypes: [EventType.AUTH_FAILED],
      windowSec: 600,
      threshold: 10,
      severity: Severity.CRITICAL,
      attackTactic: "Credential Access",
      attackTechnique: "T1110.004",
      attackName: "Credential Stuffing",
    },
    {
      name: "Impossible Travel / Geolocation Anomaly",
      description: "Successful logins to the same user account from different countries within 30 minutes.",
      eventTypes: [EventType.AUTH_LOGIN],
      windowSec: 1800,
      threshold: 2,
      severity: Severity.HIGH,
      attackTactic: "Defense Evasion",
      attackTechnique: "T1078",
      attackName: "Valid Accounts: Impossible Travel",
    },
    {
      name: "Network Reconnaissance / Port Scan",
      description: "20 or more distinct connection/port scans from a single source IP within 60 seconds.",
      eventTypes: [EventType.NETWORK_SCAN, EventType.NETWORK_CONNECT],
      windowSec: 60,
      threshold: 20,
      severity: Severity.MEDIUM,
      attackTactic: "Discovery",
      attackTechnique: "T1046",
      attackName: "Network Service Discovery",
    },
    {
      name: "Data Exfiltration Over Alternative Protocol",
      description: "Abnormally large or repeated data transfer from a single source (100MB+ / DATA_TRANSFER).",
      eventTypes: [EventType.DATA_TRANSFER],
      windowSec: 300,
      threshold: 5,
      severity: Severity.CRITICAL,
      attackTactic: "Exfiltration",
      attackTechnique: "T1048",
      attackName: "Exfiltration Over Alternative Protocol",
    },
    {
      name: "Unauthorized Administrative Execution",
      description: "Attempted process execution at an unauthorized or suspicious privilege level.",
      eventTypes: [EventType.PROCESS_EXEC],
      windowSec: 120,
      threshold: 3,
      severity: Severity.CRITICAL,
      attackTactic: "Defense Evasion",
      attackTechnique: "T1078",
      attackName: "Valid Accounts: Unauthorized Admin Execution",
    },
    {
      name: "API Rate Abuse / Flood",
      description: "More than 100 API calls made by a single source within 60 seconds.",
      eventTypes: [EventType.API_CALL],
      windowSec: 60,
      threshold: 100,
      severity: Severity.MEDIUM,
      attackTactic: "Command and Control",
      attackTechnique: "T1071",
      attackName: "Application Layer Protocol: API Abuse",
    },
  ];

  for (const rule of defaultRules) {
    await prisma.rule.upsert({
      where: { name: rule.name },
      update: rule,
      create: rule,
    });
  }

  console.log(`🛡️ ${defaultRules.length} SIEM Rules seeded successfully.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
