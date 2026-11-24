/**
 * Landing page content. Everything here mirrors what the product actually
 * does today (see the README); keep it in sync rather than embellishing.
 */

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM";

export const DETECTION_RULES: ReadonlyArray<{
  name: string;
  technique: string;
  tactic: string;
  trigger: string;
  severity: Severity;
}> = [
  {
    name: "Brute Force Attack",
    technique: "T1110.001",
    tactic: "Credential Access",
    trigger: "5+ failed logins from one IP in 10 min",
    severity: "HIGH",
  },
  {
    name: "Credential Stuffing",
    technique: "T1110.004",
    tactic: "Credential Access",
    trigger: "10+ failed logins across usernames from one IP in 10 min",
    severity: "CRITICAL",
  },
  {
    name: "Impossible Travel",
    technique: "T1078",
    tactic: "Defense Evasion",
    trigger: "Same user, successful logins from 2 countries in 30 min",
    severity: "HIGH",
  },
  {
    name: "Network Reconnaissance / Port Scan",
    technique: "T1046",
    tactic: "Discovery",
    trigger: "20+ port or connection probes from one IP in 60 sec",
    severity: "MEDIUM",
  },
  {
    name: "Data Exfiltration Over Alternative Protocol",
    technique: "T1048",
    tactic: "Exfiltration",
    trigger: "5+ large (100MB+) transfers from one source in 5 min",
    severity: "CRITICAL",
  },
  {
    name: "Unauthorized Administrative Execution",
    technique: "T1078",
    tactic: "Defense Evasion",
    trigger: "3+ suspicious process executions in 2 min",
    severity: "CRITICAL",
  },
  {
    name: "API Rate Abuse / Flood",
    technique: "T1071",
    tactic: "Command and Control",
    trigger: "100+ API calls from one source in 60 sec",
    severity: "MEDIUM",
  },
];

export const PIPELINE = [
  {
    key: "ingest",
    title: "Ingest",
    body: "Send structured JSON events or raw log lines (nginx access logs, Linux auth.log sshd lines). Every event is validated and normalized before it is stored.",
    code: "POST /api/ingest",
  },
  {
    key: "detect",
    title: "Detect",
    body: "A standalone worker evaluates sliding-window rules with atomic Redis counters on every event. No batch jobs, no polling delay.",
    code: "INCR + EXPIRE windows",
  },
  {
    key: "alert",
    title: "Alert",
    body: "Each alert carries its MITRE ATT&CK tactic and technique ID and streams to every connected analyst over Server-Sent Events.",
    code: "SSE /api/stream",
  },
  {
    key: "respond",
    title: "Respond",
    body: "Escalate an alert into an incident, assign it, set a priority from P1 to P4 and track a timeline until it is resolved.",
    code: "Incident P1–P4",
  },
] as const;

export const FEATURES = [
  {
    key: "realtime",
    title: "Real-time rule engine",
    body: "Seven seeded detection rules run as O(1) sliding windows in Redis. Thresholds and windows are configurable per rule by admins.",
  },
  {
    key: "mitre",
    title: "MITRE ATT&CK on every alert",
    body: "Rules carry a tactic, technique ID and name, so each alert is immediately placed in the context of a known adversary technique.",
  },
  {
    key: "stream",
    title: "Live alert streaming",
    body: "The dashboard keeps a Server-Sent Events connection open and updates charts, counters and the alert queue as events arrive.",
  },
  {
    key: "incidents",
    title: "Incident triage workflow",
    body: "Turn an alert into an incident with a priority, an assignee and a timeline of comments, status changes and mitigation actions.",
  },
  {
    key: "map",
    title: "Global threat map",
    body: "See where attacks originate on a full-screen map and click any marker to triage the underlying alert.",
  },
  {
    key: "simulator",
    title: "Built-in attack simulator",
    body: "Trigger brute force, port scan and exfiltration traffic from the dashboard to see detection work without a real attacker.",
  },
] as const;

export const SECURITY = [
  {
    key: "auth",
    title: "Hardened sessions",
    body: "Short-lived JWT access tokens and refresh tokens in an httpOnly, sameSite=strict cookie. Refresh rotates the token and revokes the old one through a Redis denylist.",
  },
  {
    key: "authz",
    title: "Gated APIs and roles",
    body: "Every data route requires a Bearer token, and mutating routes additionally require the ADMIN or ANALYST role.",
  },
  {
    key: "ingest",
    title: "Protected ingest",
    body: "API-key check in constant time, per-key rate limiting, request and payload size caps, and Zod validation before anything reaches the database.",
  },
  {
    key: "secrets",
    title: "No secrets in source",
    body: "Signing secrets and the ingest key have no hardcoded fallback. The app refuses to start without strong values, and the browser never sees the ingest key.",
  },
  {
    key: "headers",
    title: "Security headers",
    body: "CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy on every response, mirrored at the nginx layer.",
  },
  {
    key: "infra",
    title: "Locked-down infrastructure",
    body: "Postgres and Redis stay on an internal Docker network, containers run as non-root, and every service has resource limits and health checks.",
  },
] as const;

export const TECH_STACK = [
  "Next.js 15",
  "TypeScript",
  "Redis Pub/Sub",
  "PostgreSQL + Prisma",
  "Server-Sent Events",
  "Recharts",
  "Leaflet",
  "pnpm + Turborepo",
  "Docker Compose",
  "Nginx",
] as const;

export const FAQ = [
  {
    key: "what",
    q: "What is Watchlight?",
    a: "Watchlight is an open-source mini-SIEM and SOC dashboard. It ingests security events, detects attacks with sliding-window rules mapped to MITRE ATT&CK, streams alerts to analysts in real time and supports incident response from one place.",
  },
  {
    key: "sources",
    q: "Which log sources can it ingest?",
    a: "Structured JSON events (a single event or a batch) and raw log lines: nginx access logs, Linux auth.log sshd lines and generic JSON. Everything is sent to POST /api/ingest with an API key and is normalized into one event shape.",
  },
  {
    key: "detection",
    q: "How does detection work?",
    a: "A standalone worker subscribes to the event stream and evaluates each rule with Redis INCR and EXPIRE counters, so every event costs O(1). When a threshold is crossed inside its time window, an alert is written and pushed live to the browser.",
  },
  {
    key: "replace",
    q: "Is it a replacement for Splunk, QRadar or Microsoft Sentinel?",
    a: "No. It is a small, self-hosted, open-source slice of what those products do. It is well suited to learning, labs and small environments, and its code base is small enough to read end to end.",
  },
  {
    key: "run",
    q: "How do I run it?",
    a: "Clone the repository, copy .env.example to .env, set the secrets and start the stack with Docker Compose. A dev compose file runs only Postgres and Redis so you can run the apps natively with pnpm dev. The README has the full steps.",
  },
  {
    key: "license",
    q: "Is Watchlight free to use?",
    a: "Yes. It is released under the MIT license.",
  },
] as const;
