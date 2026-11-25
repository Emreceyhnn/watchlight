/**
 * Blog content. Every claim here mirrors the README and the code in this repo;
 * keep it factual rather than promotional.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "code"; lang: string; code: string };

export type Post = {
  slug: string;
  title: string;
  description: string;
  /** ISO date, YYYY-MM-DD. Used for datePublished and sitemap lastmod. */
  published: string;
  updated: string;
  readMinutes: number;
  body: Block[];
};

export const POSTS: ReadonlyArray<Post> = [
  {
    slug: "what-is-watchlight",
    title: "What is Watchlight? An open-source mini-SIEM for small teams",
    description:
      "Watchlight is a self-hosted, open-source mini-SIEM and SOC dashboard with real-time detection, MITRE ATT&CK-mapped alerts and incident triage.",
    published: "2026-11-26",
    updated: "2026-11-26",
    readMinutes: 4,
    body: [
      {
        type: "p",
        text: "Security Information and Event Management (SIEM) platforms such as Splunk, IBM QRadar and Microsoft Sentinel are powerful, but they are also large and expensive to run. Watchlight is a small, self-hosted alternative: a TypeScript monorepo you can read end to end, built around the core loop of a SOC analyst's day.",
      },
      { type: "h2", text: "What it does" },
      {
        type: "ul",
        items: [
          "Ingests security events as structured JSON, or as raw nginx access log and Linux auth.log sshd lines.",
          "Evaluates sliding-window detection rules in a separate worker process, using Redis counters.",
          "Tags every alert with a MITRE ATT&CK tactic, technique ID and name.",
          "Streams new events and alerts to the dashboard over Server-Sent Events, without polling.",
          "Lets an analyst turn an alert into an incident, assign it, set a priority from P1 to P4 and keep a timeline.",
          "Includes a built-in attack simulator, so you can see detections fire without a real attacker.",
        ],
      },
      { type: "h2", text: "Who it is for" },
      {
        type: "p",
        text: "Watchlight is meant for learning, labs and small self-hosted setups. It is not a replacement for an enterprise SIEM. If you want to understand how detection, alert routing and incident triage fit together, the codebase is a practical place to start.",
      },
      { type: "h2", text: "The stack" },
      {
        type: "p",
        text: "The web app and API use Next.js 15 (App Router). A separate worker runs the rule engine. Redis handles counters and pub/sub, PostgreSQL stores events, alerts and incidents, and Prisma is the data layer. The production setup runs everything in Docker behind nginx, with TLS, security headers and rate limiting.",
      },
      {
        type: "p",
        text: "Source code is at github.com/Emreceyhnn/watchlight (MIT license). Try the dashboard with the built-in simulator, or read the detection rules write-up next.",
      },
    ],
  },
  {
    slug: "sliding-window-detection-with-redis",
    title: "How Watchlight detects attacks with sliding-window counters in Redis",
    description:
      "A look at how Watchlight's rule engine counts events per IP or user in a time window using Redis INCR and EXPIRE, with no batch jobs.",
    published: "2026-11-26",
    updated: "2026-11-26",
    readMinutes: 5,
    body: [
      {
        type: "p",
        text: "Most simple detections are threshold rules: 'five failed logins from one IP in ten minutes'. Watchlight evaluates rules like this on every event as it arrives, instead of running a scheduled batch query over the database.",
      },
      { type: "h2", text: "The idea" },
      {
        type: "p",
        text: "For each rule and each key (for example, a source IP), the worker keeps a counter in Redis. When a matching event arrives, it increments the counter and sets an expiry on the window. When the counter crosses the rule's threshold inside the window, the worker writes an alert.",
      },
      {
        type: "code",
        lang: "text",
        code: "key:    brute_force:ip:203.0.113.7\nINCR   -> 1, 2, 3, 4, 5   (each failed login)\nEXPIRE -> window length, e.g. 600 seconds\nthreshold reached (5) -> create alert, T1110.001",
      },
      {
        type: "p",
        text: "Each increment is a single O(1) Redis operation, so the cost of evaluating a rule does not grow with the number of stored events.",
      },
      { type: "h2", text: "Rules in the seed data" },
      {
        type: "p",
        text: "Watchlight ships with seven rules. Two examples:",
      },
      {
        type: "ul",
        items: [
          "Brute Force Attack (T1110.001, Credential Access): 5+ failed logins from one IP in 10 minutes, severity HIGH.",
          "Network Reconnaissance / Port Scan (T1046, Discovery): 20+ port or connection probes from one IP in 60 seconds, severity MEDIUM.",
        ],
      },
      { type: "h2", text: "Thresholds are configurable" },
      {
        type: "p",
        text: "Each rule's threshold and window are stored in PostgreSQL and can be changed through the rules API by an admin. The worker reloads rules when a 'rules:reload' message is published, so you do not need to restart the process.",
      },
      { type: "h2", text: "Limits of this approach" },
      {
        type: "p",
        text: "Counters only see what is inside their window. They do not model long-term baselines, and they will not catch an attack that stays just under every threshold. Treat Watchlight's rules as a starting point and tune them against your own traffic.",
      },
    ],
  },
  {
    slug: "self-host-watchlight-with-docker",
    title: "Self-hosting Watchlight with Docker Compose",
    description:
      "Step-by-step notes for running Watchlight in production with Docker Compose, nginx, TLS and the secrets it requires.",
    published: "2026-11-26",
    updated: "2026-11-26",
    readMinutes: 5,
    body: [
      {
        type: "p",
        text: "The production path in the repository uses docker-compose.yml. Postgres and Redis sit on an internal Docker network with no host-exposed ports. Containers run as non-root, and nginx terminates TLS and applies security headers and rate limits.",
      },
      { type: "h2", text: "1. Prepare the environment" },
      {
        type: "code",
        lang: "bash",
        code: "cp .env.example .env\n# Generate strong values; never reuse anything that was shared or committed\nopenssl rand -base64 48   # JWT_ACCESS_SECRET, JWT_REFRESH_SECRET\nopenssl rand -hex 32      # INGEST_API_KEY",
      },
      { type: "h2", text: "2. Set the database secrets" },
      {
        type: "p",
        text: "Set POSTGRES_PASSWORD and REDIS_PASSWORD to fresh values. Before seeding a production database, set SEED_ADMIN_PASSWORD and SEED_ANALYST_PASSWORD. The seed script refuses to run with the default passwords when NODE_ENV is production.",
      },
      { type: "h2", text: "3. Add TLS certificates and your domain" },
      {
        type: "ul",
        items: [
          "Mount your TLS certificates at ./certs/.",
          "Set server_name in nginx.conf to your real domain.",
          "Review the rate limits in nginx.conf and apps/web/src/lib/rate-limit.ts for your expected traffic.",
        ],
      },
      { type: "h2", text: "4. Start the stack" },
      {
        type: "code",
        lang: "bash",
        code: "docker compose up -d --build",
      },
      {
        type: "p",
        text: "The web app exposes GET /api/health as a liveness probe that also checks database connectivity. Use it in your monitoring or load balancer checks.",
      },
      { type: "h2", text: "5. Send events" },
      {
        type: "p",
        text: "Send events to POST /api/ingest with the X-API-Key header. The endpoint accepts one event, a batch, or a raw log line. Every event is validated and normalized before it is stored.",
      },
      { type: "h2", text: "Before real traffic" },
      {
        type: "p",
        text: "Rotate every secret, confirm the seeded accounts are changed, and set up off-box backups for the Postgres volume. The README has the full deployment checklist.",
      },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
