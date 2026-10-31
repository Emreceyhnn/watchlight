# 🛡️ Watchlight — Mini-SIEM / SOC Dashboard

![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![Redis](https://img.shields.io/badge/Redis-Pub%2FSub-red.svg)
![MITRE ATT&CK](https://img.shields.io/badge/MITRE-ATT%26CK%20Aligned-orange.svg)

**Watchlight** is a real-time Security Information and Event Management (SIEM) /
Security Operations Center (SOC) dashboard. It ingests security events (logs),
detects anomalies with a sliding-window rule engine, maps every rule to a
**MITRE ATT&CK** technique, streams alerts to analysts in real time, and lets
them triage alerts into full incident-response workflows.

Think of it as a small, self-hosted, open-source slice of what Splunk /
QRadar / Microsoft Sentinel do — built as a TypeScript monorepo you can read
end-to-end in an afternoon.

---

## Table of Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Monorepo layout](#monorepo-layout)
- [Detection rules (MITRE ATT&CK)](#detection-rules-mitre-attck)
- [Data model](#data-model)
- [Security model](#security-model)
- [Getting started (local development)](#getting-started-local-development)
- [Running with Docker](#running-with-docker)
- [API reference](#api-reference)
- [Load testing / benchmarking](#load-testing--benchmarking)
- [Tests](#tests)
- [Deployment checklist](#deployment-checklist)
- [Tech stack](#tech-stack)
- [License](#license)

---

## What it does

1. **Ingests security events** — `POST /api/ingest` accepts structured JSON
   (single event or batch), or raw log lines (nginx access log format,
   Linux `auth.log` sshd lines, or generic JSON) which are parsed into a
   normalized event shape before being stored.
2. **Detects attacks in real time** — a standalone worker process
   (`apps/worker`) subscribes to the event stream and evaluates a library of
   sliding-window detection rules (e.g. "5+ failed logins from one IP in
   10 minutes") using atomic Redis counters. No batch jobs, no polling delay.
3. **Maps every detection to MITRE ATT&CK** — each rule carries an
   `attackTactic`, `attackTechnique` (e.g. `T1110.001`) and `attackName`, so
   every alert is immediately contextualized against a known adversary
   technique.
4. **Streams alerts live to the browser** — the dashboard holds a
   Server-Sent Events (SSE) connection and reacts to new events/alerts
   instantly, with no polling.
5. **Supports full incident response** — an analyst can escalate an alert
   into an `Incident`, assign it, set a priority (P1–P4), and track a
   timeline of actions/notes until it's resolved.
6. **Ships with a built-in attack simulator** — `apps/simulator` and the
   in-dashboard "Test Brute Force / Port Scan / Exfil" buttons let you
   generate realistic attack traffic without needing a real attacker.

---

## Architecture

```
                         Log sources (nginx, sshd, generic JSON, simulator)
                                           |
                                           v  POST /api/ingest  (X-API-Key)
                 +---------------------------------------------------------+
                 |  apps/web  (Next.js 15 App Router)                     |
                 |                                                       |
                 |   /api/ingest --> rate-limit --> API-key check        |
                 |        --> raw-log normalizer (nginx/sshd/json)       |
                 |        --> Zod schema validation                      |
                 |        --> Postgres (SecurityEvent)                   |
                 |        --> Redis PUBLISH "events:stream"               |
                 |                                                       |
                 |   /api/auth/*     JWT access + refresh (httpOnly       |
                 |                   cookie, rotation, Redis denylist)   |
                 |   /api/alerts, /api/incidents, /api/rules,             |
                 |   /api/stats/summary   -- all Bearer-token gated       |
                 |   /api/stream     SSE gateway (token in query param)   |
                 +---------------------------------------------------------+
                             |                              |
             SUBSCRIBE "events:stream"            SUBSCRIBE "events:stream" /
             "rules:reload"                        "alerts:stream" (SSE relay)
                             |                              |
                             v                               v
                 +------------------------+     +--------------------------+
                 | apps/worker            |     |  Browser (SOC UI)        |
                 | Rule Engine             |     |  - Live EPS / severity   |
                 | - sliding-window counts |     |    charts (Recharts)     |
                 | - MITRE ATT&CK mapping  |     |  - Threat map (Leaflet)  |
                 | - dedup / throttling    |     |  - Incident triage modal |
                 | --> writes Alert rows   |     |  - Login / JWT session   |
                 | --> PUBLISH             |     +--------------------------+
                 |     "alerts:stream"     |
                 +------------------------+
```

**Why Redis Pub/Sub instead of a message queue?** This is a dashboard, not a
durable event-sourcing system — at-most-once delivery to currently-connected
analysts is the right trade-off, and Redis gives sub-millisecond fan-out with
near-zero operational overhead compared to Kafka/RabbitMQ.

**Why SSE instead of WebSockets?** The data flow here is one-directional
(server → browser). SSE gets you auto-reconnect, works over plain HTTP/1.1,
and needs no extra client library — `EventSource` is built into every
browser.

---

## Monorepo layout

```
watchlight/
├── apps/
│   ├── web/            Next.js 15 app — UI + all HTTP APIs (App Router)
│   ├── worker/         Standalone rule-engine process (no HTTP server)
│   └── simulator/       Attack-traffic generator (brute force, port scan, exfil)
├── packages/
│   ├── db/              Prisma schema, client, migrations, seed script
│   ├── shared/          Zod schemas & shared TypeScript types (single source
│   │                     of truth for event/alert/incident/rule shapes)
│   └── config/          Shared tsconfig/eslint base config
├── scripts/
│   └── bench.mjs        Throughput/latency load-test script
├── Dockerfile            Multi-stage build (web / worker / simulator targets)
├── docker-compose.yml    Production compose (internal network, no exposed
│                          DB/Redis ports, resource limits, healthchecks)
├── docker-compose.dev.yml  Local-only: Postgres + Redis bound to 127.0.0.1
│                            so you can run apps natively with `pnpm dev`
└── nginx.conf            Reverse proxy: TLS, HSTS/CSP headers, rate limiting
```

Package manager: **pnpm** workspaces, orchestrated by **Turborepo**.

---

## Detection rules (MITRE ATT&CK)

Seeded by `packages/db/prisma/seed.ts`. All thresholds/windows are
configurable per-rule via `POST /api/rules` (admin-only).

| Rule | MITRE Technique | Tactic | Trigger | Severity |
|---|---|---|---|---|
| Brute Force Attack | `T1110.001` | Credential Access | 5+ failed logins from one IP in 10 min | HIGH |
| Credential Stuffing | `T1110.004` | Credential Access | 10+ failed logins across usernames from one IP in 10 min | CRITICAL |
| Impossible Travel / Geolocation Anomaly | `T1078` | Defense Evasion | Same user, successful logins from 2 countries in 30 min | HIGH |
| Network Reconnaissance / Port Scan | `T1046` | Discovery | 20+ port/connection probes from one IP in 60 sec | MEDIUM |
| Data Exfiltration Over Alternative Protocol | `T1048` | Exfiltration | 5+ large (100MB+) transfers from one source in 5 min | CRITICAL |
| Unauthorized Administrative Execution | `T1078` | Defense Evasion | 3+ suspicious process executions in 2 min | CRITICAL |
| API Rate Abuse / Flood | `T1071` | Command and Control | 100+ API calls from one source in 60 sec | MEDIUM |

The rule engine (`apps/worker`) evaluates these using Redis `INCR` +
`EXPIRE` sliding windows — O(1) per event, no scheduled batch jobs.

---

## Data model

Defined in `packages/db/prisma/schema.prisma` (PostgreSQL via Prisma):

- **SecurityEvent** — every ingested log/event, normalized (type, source/dest
  IP & port, username, user agent, path, arbitrary JSON payload, geo-country).
- **Rule** — a detection rule: event types it watches, window, threshold,
  severity, and its MITRE ATT&CK mapping.
- **Alert** — fired when a rule's threshold is crossed within its window.
- **Incident** — an alert escalated for formal response; has priority
  (P1–P4), status, assignee, and a timeline.
- **IncidentEvent** — timeline entries (comments, status changes, assignment,
  mitigation actions) on an incident.
- **User** — `ADMIN` / `ANALYST` / `VIEWER` roles, bcrypt-hashed passwords.

---

## Security model

This matters more than usual for a security-monitoring tool, so it's
documented explicitly:

- **Authentication**: JWT access tokens (15 min TTL, signed `HS256`) +
  refresh tokens (7 day TTL) stored as an `httpOnly`, `secure` (in prod),
  `sameSite: strict` cookie. Refresh rotates the token and revokes the old
  one via a Redis denylist (`jti` tracking) on every refresh and on logout.
- **Authorization**: every data-bearing API route (`/api/alerts`,
  `/api/incidents`, `/api/rules`, `/api/events`, `/api/stats/summary`,
  `/api/stream`) requires a valid `Authorization: Bearer <token>` (or, for
  the SSE stream, a `?token=` query param since `EventSource` cannot send
  custom headers). Mutating routes (`POST /api/rules`,
  `POST /api/incidents`) additionally require `ADMIN`/`ANALYST` role.
- **No secrets ship in source or in the client bundle.** `JWT_ACCESS_SECRET`,
  `JWT_REFRESH_SECRET`, and `INGEST_API_KEY` have **no hardcoded fallback** —
  the app throws on first use if they're missing or under 32 characters.
  The dashboard's "trigger simulation" button calls a server-side proxy
  (`/api/simulate`) that holds the real ingest key; the browser never sees it.
- **Ingest endpoint** (`/api/ingest`) is protected by a static API key
  compared with `crypto.timingSafeEqual` (constant-time), is rate-limited
  per key (200 req/min), caps request bodies at 256KB and any single
  event's `payload` JSON at 10KB, and validates every event — including the
  raw-log parser path — through a Zod schema before it reaches the database.
- **Security headers**: CSP, HSTS (prod), X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy and Permissions-Policy are set in `middleware.ts` for every
  page/route, and mirrored at the nginx layer for defense in depth.
- **Infrastructure**: the production `docker-compose.yml` keeps Postgres and
  Redis off the host network entirely (`internal: true` network — only
  reachable from other containers), requires a Redis password, runs all
  containers as a non-root user, and sets CPU/memory limits + healthchecks
  on every service. `nginx.conf` terminates TLS, redirects HTTP→HTTPS, and
  rate-limits both general traffic and the ingest endpoint.

If you're auditing this repo: the above was retrofitted after a dedicated
multi-agent security review (auth bypasses on 3 routes, hardcoded secrets,
an open SSE stream, exposed DB ports) — see git history for the fixes.

---

## Getting started (local development)

### Prerequisites
- Node.js 22+
- pnpm 11+ (`corepack enable && corepack prepare pnpm@11.25.0 --activate`)
- Docker (for Postgres + Redis — or run them natively if you prefer)

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in real values. Generate strong secrets with:
```bash
openssl rand -base64 48   # for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
openssl rand -hex 32      # for INGEST_API_KEY
```

### 3. Start Postgres + Redis (dev-only compose)
```bash
docker compose -f docker-compose.dev.yml --env-file .env up -d
```
This binds both to `127.0.0.1` only — fine for local dev, not used in prod.

### 4. Set up the database
```bash
pnpm --filter @watchlight/db db:generate   # generate Prisma client
pnpm --filter @watchlight/db db:push       # apply schema (or db:migrate)
pnpm --filter @watchlight/db db:seed       # seed users + default rules
```
Seeded accounts (change these before anything public-facing):
- `admin@watchlight.local` / `Admin123*!` (or your `SEED_ADMIN_PASSWORD`)
- `analyst@watchlight.local` / `Analyst123*!` (or your `SEED_ANALYST_PASSWORD`)

### 5. Run everything
```bash
pnpm dev
```
This runs `turbo run dev` across all apps with your root `.env` loaded via
`dotenv-cli`. Open **http://localhost:3000** and log in.

To run the attack simulator standalone instead of using the dashboard buttons:
```bash
pnpm --filter @watchlight/simulator dev
```

---

## Running with Docker

The production path uses `docker-compose.yml`, which isolates Postgres/Redis
on an internal Docker network (no host-exposed ports), runs non-root
containers, and fronts everything with nginx (TLS + security headers +
rate limiting).

```bash
cp .env.example .env   # fill in real production secrets
docker compose up -d --build
```

You'll need TLS certificates mounted at `./certs/fullchain.pem` and
`./certs/privkey.pem` (e.g. from Let's Encrypt/certbot) before `nginx`
will start successfully — `nginx.conf` listens on 443 and redirects all
HTTP traffic to HTTPS.

---

## API reference

All responses follow `{ success: boolean, data?: ..., error?: { code, message } }`.
Routes marked 🔒 require `Authorization: Bearer <accessToken>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Email/password login, returns access token + sets refresh cookie |
| POST | `/api/auth/refresh` | cookie | Rotates refresh token, returns new access token |
| POST | `/api/auth/logout` | cookie | Revokes refresh token |
| POST | `/api/ingest` | API key (`X-API-Key`) | Ingest one event, a batch, or a raw log line |
| GET | `/api/events` | 🔒 | Paginated security events, filterable by IP/user/type/country/time |
| GET | `/api/alerts` | 🔒 | List alerts, filterable by status/severity |
| GET/POST | `/api/incidents` | 🔒 (POST: ADMIN/ANALYST) | List incidents / escalate an alert into an incident |
| GET/POST | `/api/rules` | 🔒 (POST: ADMIN) | List detection rules / create a new rule |
| GET | `/api/stats/summary` | 🔒 | Dashboard summary: counts, top attacker IPs, severity distribution |
| GET | `/api/stream` | 🔒 (`?token=`) | SSE stream of live events + alerts |
| POST | `/api/simulate` | 🔒 (ADMIN/ANALYST) | Server-side proxy that injects demo attack events via the ingest key |
| GET | `/api/health` | — | Liveness probe (checks DB connectivity) |

---

## Load testing / benchmarking

```bash
pnpm bench
```
Fires a configurable burst of events at `/api/ingest` and reports
throughput (events/sec) and p50/p95/p99 latency — useful for validating the
"1,000+ EPS" ingestion claim against your own hardware/DB tier.

---

## Tests

```bash
pnpm test
```
Runs Vitest unit/integration tests (currently covering `packages/shared`
schema validation). CI (`.github/workflows/ci.yml`) runs install → Prisma
generate → tests → full Turbo build on every push/PR to `main`.

---

## Deployment checklist

Before pointing this at real traffic:

- [ ] Generate fresh `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
      `INGEST_API_KEY`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD` — never reuse
      anything that was ever committed or shared.
- [ ] Set `SEED_ADMIN_PASSWORD` / `SEED_ANALYST_PASSWORD` before seeding a
      production database (the seed script refuses to run with default
      passwords when `NODE_ENV=production`).
- [ ] Mount real TLS certificates at `./certs/`.
- [ ] Point `server_name` in `nginx.conf` at your real domain.
- [ ] Review and tune the rate limits in `nginx.conf` and
      `apps/web/src/lib/rate-limit.ts` for your expected traffic.
- [ ] Set up off-box backups for the Postgres volume.

---

## Tech stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Recharts,
  Leaflet
- **Backend**: Next.js Route Handlers, Node.js worker process
- **Database**: PostgreSQL + Prisma ORM
- **Cache / messaging**: Redis (Pub/Sub, sliding-window counters, rate
  limiting, refresh-token denylist)
- **Validation**: Zod (shared schemas across API boundaries)
- **Auth**: `jose` (JWT), `bcryptjs` (password hashing)
- **Infra**: Docker (multi-stage, non-root), nginx, Turborepo, pnpm workspaces
- **Testing**: Vitest

---

## License

MIT.
