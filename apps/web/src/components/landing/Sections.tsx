import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  Crosshair,
  EyeOff,
  FlaskConical,
  Github,
  Globe,
  Inbox,
  KeyRound,
  Radio,
  Server,
  ShieldCheck,
  UserCheck,
  Zap,
} from "lucide-react";
import { DASHBOARD_PATH, GITHUB_URL } from "@/lib/site";
import {
  DETECTION_RULES,
  FAQ,
  FEATURES,
  PIPELINE,
  SECURITY,
  TECH_STACK,
  type Severity,
} from "./content";
import {
  card,
  container,
  eyebrow,
  h2,
  lead,
  primaryBtn,
  sectionBase,
  secondaryBtn,
} from "./ui";

const FEATURE_ICONS = {
  realtime: Zap,
  mitre: Crosshair,
  stream: Radio,
  incidents: ClipboardList,
  map: Globe,
  simulator: FlaskConical,
} as const;

const SECURITY_ICONS = {
  auth: KeyRound,
  authz: UserCheck,
  ingest: Inbox,
  secrets: EyeOff,
  headers: ShieldCheck,
  infra: Server,
} as const;

const SEVERITY_STYLES: Record<Severity, string> = {
  CRITICAL: "border-soc-critical/40 bg-soc-critical/10 text-soc-critical",
  HIGH: "border-soc-high/40 bg-soc-high/10 text-soc-high",
  MEDIUM: "border-soc-medium/40 bg-soc-medium/10 text-soc-medium",
};

const SEVERITY_DOT: Record<Severity, string> = {
  CRITICAL: "bg-soc-critical",
  HIGH: "bg-soc-high",
  MEDIUM: "bg-soc-medium",
};

function SectionHeading({
  id,
  kicker,
  title,
  subtitle,
  align = "center",
}: {
  id: string;
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`mb-12 max-w-2xl md:mb-16 ${
        align === "center" ? "mx-auto text-center" : ""
      }`}
    >
      <p className={eyebrow}>{kicker}</p>
      <h2 id={id} className={`${h2} mt-3`}>
        {title}
      </h2>
      {subtitle && <p className={`${lead} mt-4`}>{subtitle}</p>}
    </div>
  );
}

function mitreUrl(technique: string) {
  return `https://attack.mitre.org/techniques/${technique.replace(".", "/")}/`;
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

function FloatingAlert({
  className,
  technique,
  name,
  severity,
}: {
  className: string;
  technique: string;
  name: string;
  severity: Severity;
}) {
  return (
    <div
      aria-hidden
      className={`absolute hidden items-center gap-3 rounded-lg border border-soc-border bg-soc-panel/95 px-3.5 py-2.5 shadow-2xl backdrop-blur md:flex ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${SEVERITY_DOT[severity]}`}
        />
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${SEVERITY_DOT[severity]}`}
        />
      </span>
      <span className="text-left">
        <span className="block font-mono text-[11px] text-gray-400">
          {technique}
        </span>
        <span className="block text-sm font-medium text-white">{name}</span>
      </span>
      <span
        className={`ml-2 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${SEVERITY_STYLES[severity]}`}
      >
        {severity}
      </span>
    </div>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-24"
    >
      <div aria-hidden className="soc-grid-bg pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(70%_60%_at_50%_0%,#000,transparent)]" />
      <div aria-hidden className="soc-radial-glow pointer-events-none absolute inset-x-0 top-0 h-[640px]" />

      <div className={`${container} relative text-center`}>
        <p className="inline-flex items-center gap-2 rounded-full border border-soc-accent/30 bg-soc-accent/10 px-3.5 py-1.5 font-mono text-xs text-soc-accent">
          <span aria-hidden className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-soc-accent opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-soc-accent" />
          </span>
          Open-source mini-SIEM · SOC dashboard
        </p>

        <h1
          id="hero-title"
          className="mx-auto mt-6 max-w-3xl font-heading text-4xl font-bold leading-[1.05] tracking-tight text-white [text-wrap:balance] sm:text-5xl md:text-6xl"
        >
          See attacks{" "}
          <span className="bg-gradient-to-r from-soc-accent to-[#9DB8FF] bg-clip-text text-transparent">
            the moment they happen
          </span>
          .
        </h1>

        <p className={`${lead} mx-auto mt-6 max-w-2xl`}>
          Watchlight ingests your security logs, detects threats with
          sliding-window rules mapped to MITRE ATT&amp;CK, and streams alerts to
          your analysts live, from brute-force logins to data exfiltration.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={DASHBOARD_PATH} className={primaryBtn}>
            Open the dashboard
            <ArrowRight size={16} aria-hidden />
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryBtn}
          >
            <Github size={16} aria-hidden />
            View on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>

        <p className="mt-6 font-mono text-xs text-gray-400">
          Next.js · Redis · PostgreSQL · MITRE ATT&amp;CK · MIT licensed
        </p>
      </div>

      <div className={`${container} relative mt-14 md:mt-16`}>
        <figure className="relative">
          <div
            aria-hidden
            className="absolute -inset-x-6 -inset-y-8 -z-10 bg-[radial-gradient(closest-side,rgba(91,140,255,0.22),transparent)] blur-2xl"
          />
          <div className="overflow-hidden rounded-xl border border-soc-border bg-soc-card shadow-[0_30px_80px_-20px_rgba(91,140,255,0.28)]">
            <div
              aria-hidden
              className="flex items-center gap-2 border-b border-soc-border bg-soc-panel px-4 py-3"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-soc-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-soc-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-soc-border" />
              <span className="ml-3 hidden rounded-md bg-soc-base px-3 py-1 font-mono text-[11px] text-gray-400 sm:block">
                watchlight.emreceyhan.xyz/dashboard
              </span>
            </div>
            <Image
              src="/screenshots/dashboard.jpg"
              alt="The Watchlight SOC dashboard showing events per second, open alerts, critical severity count, an event ingestion chart, an alert severity breakdown and a threat geolocation map"
              width={1568}
              height={755}
              priority
              fetchPriority="high"
              unoptimized
              className="h-auto w-full"
            />
          </div>

          <FloatingAlert
            className="-left-4 top-[22%] lg:-left-10"
            technique="T1110.001 · Credential Access"
            name="Brute Force Attack"
            severity="HIGH"
          />
          <FloatingAlert
            className="-right-4 bottom-[14%] lg:-right-10"
            technique="T1048 · Exfiltration"
            name="Data Exfiltration"
            severity="CRITICAL"
          />
          <figcaption className="mt-5 text-center font-mono text-xs text-gray-400">
            Live event ingestion, alert severity and attack origins in one view.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works                                                                */
/* -------------------------------------------------------------------------- */

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className={`${sectionBase} border-y border-soc-border-soft bg-soc-dark`}
    >
      <div className={container}>
        <SectionHeading
          id="how-title"
          kicker="How it works"
          title="From raw logs to a resolved incident"
          subtitle="One pipeline, four steps, no batch jobs: every event is evaluated the moment it arrives."
        />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((step, index) => (
            <li key={step.key} className={`${card} relative`}>
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-soc-accent/70 to-transparent"
              />
              <p className="font-mono text-xs text-soc-accent">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-heading text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                {step.body}
              </p>
              <p className="mt-5 inline-block rounded-md border border-soc-border bg-soc-base px-2.5 py-1 font-mono text-xs text-gray-300">
                {step.code}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Features                                                                    */
/* -------------------------------------------------------------------------- */

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className={sectionBase}
    >
      <div className={container}>
        <SectionHeading
          id="features-title"
          kicker="Features"
          title="Everything a small SOC needs to detect and respond"
          subtitle="Detection, context, live visibility and incident handling in one self-hosted app."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.key];
            return (
              <li key={feature.key} className={card}>
                <span
                  aria-hidden
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-soc-accent/25 bg-soc-accent/10 text-soc-accent"
                >
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 font-heading text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {feature.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Product tour                                                                */
/* -------------------------------------------------------------------------- */

export function ProductTour() {
  return (
    <section
      aria-labelledby="tour-title"
      className={`${sectionBase} border-y border-soc-border-soft bg-soc-dark`}
    >
      <div className={container}>
        <SectionHeading
          id="tour-title"
          kicker="Product tour"
          title="Triage alerts and see where attacks come from"
          subtitle="Every alert links to its MITRE ATT&CK technique and can be escalated into an incident in one click."
        />
        <div className="grid gap-8 lg:grid-cols-2">
          <figure>
            <div className="overflow-hidden rounded-xl border border-soc-border bg-soc-card">
              <Image
                src="/screenshots/alerts.jpg"
                alt="The Watchlight security alerts queue, with each alert tagged with a MITRE ATT&CK technique ID and ready to escalate to an incident"
                width={1568}
                height={755}
                unoptimized
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-4 text-sm leading-relaxed text-gray-400">
              <strong className="font-semibold text-gray-200">
                Alert queue.
              </strong>{" "}
              Each alert is mapped to a MITRE ATT&amp;CK technique and ready
              for one-click triage into an incident.
            </figcaption>
          </figure>
          <figure>
            <div className="overflow-hidden rounded-xl border border-soc-border bg-soc-card">
              <Image
                src="/screenshots/threat-map.jpg"
                alt="The Watchlight full-screen threat map showing attack origins as markers that can be clicked to triage the underlying alert"
                width={1568}
                height={755}
                unoptimized
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-4 text-sm leading-relaxed text-gray-400">
              <strong className="font-semibold text-gray-200">
                Threat map.
              </strong>{" "}
              A full-screen view of attack origins. Click a marker to triage
              the alert behind it.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Detection rules                                                             */
/* -------------------------------------------------------------------------- */

export function DetectionRules() {
  return (
    <section id="rules" aria-labelledby="rules-title" className={sectionBase}>
      <div className={container}>
        <SectionHeading
          id="rules-title"
          kicker="Detection rules"
          title="Seven rules, each mapped to MITRE ATT&CK"
          subtitle="Thresholds and windows are configurable per rule by admins. Every rule carries its tactic, technique ID and severity."
        />
        <div
          role="region"
          aria-label="Detection rules and their MITRE ATT&CK mapping"
          // A horizontally scrollable region must be keyboard-focusable
          // (axe: scrollable-region-focusable), which this rule forbids.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="overflow-x-auto rounded-xl border border-soc-border bg-soc-card"
        >
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <caption className="sr-only">
              Detection rules with MITRE ATT&amp;CK technique, tactic, trigger
              condition and severity
            </caption>
            <thead>
              <tr className="border-b border-soc-border bg-soc-panel font-mono text-xs uppercase tracking-wider text-gray-400">
                <th scope="col" className="px-5 py-3.5 font-medium">Rule</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Technique</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Tactic</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Trigger</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {DETECTION_RULES.map((rule) => (
                <tr
                  key={rule.name}
                  className="border-b border-soc-border-soft last:border-0 hover:bg-soc-panel/60"
                >
                  <th
                    scope="row"
                    className="px-5 py-4 font-medium text-white"
                  >
                    {rule.name}
                  </th>
                  <td className="px-5 py-4">
                    <a
                      href={mitreUrl(rule.technique)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`MITRE ATT&CK ${rule.technique} (opens in a new tab)`}
                      className="rounded border border-soc-accent/30 bg-soc-accent/10 px-2 py-0.5 font-mono text-xs text-soc-accent hover:bg-soc-accent/20"
                    >
                      {rule.technique}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-gray-300">{rule.tactic}</td>
                  <td className="px-5 py-4 text-gray-400">{rule.trigger}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 font-mono text-[11px] font-semibold ${SEVERITY_STYLES[rule.severity]}`}
                    >
                      {rule.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center font-mono text-xs text-gray-400">
          Rules are evaluated with Redis INCR + EXPIRE sliding windows, so each
          event costs O(1).
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Security model + stack                                                      */
/* -------------------------------------------------------------------------- */

export function SecurityAndStack() {
  return (
    <section
      aria-labelledby="security-title"
      className={`${sectionBase} border-y border-soc-border-soft bg-soc-dark`}
    >
      <div className={container}>
        <SectionHeading
          id="security-title"
          kicker="Security model"
          title="Built like the security tool it is"
          subtitle="A monitoring tool is a high-value target, so the platform is hardened end to end."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY.map((item) => {
            const Icon = SECURITY_ICONS[item.key];
            return (
              <li key={item.key} className={card}>
                <span
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-soc-success/25 bg-soc-success/10 text-soc-success"
                >
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {item.body}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-14 flex flex-col items-start justify-between gap-8 rounded-xl border border-soc-border bg-soc-card p-6 md:flex-row md:items-center md:p-8">
          <div className="max-w-md">
            <h3 className="font-heading text-xl font-semibold text-white">
              Open source, small enough to read
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              A TypeScript monorepo you can read end to end. Self-host the whole
              stack with Docker Compose, MIT licensed.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${secondaryBtn} mt-5`}
            >
              <Github size={16} aria-hidden />
              Read the source
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <ul
            aria-label="Technology stack"
            className="flex flex-wrap gap-2 md:max-w-md md:justify-end"
          >
            {TECH_STACK.map((name) => (
              <li
                key={name}
                className="rounded-md border border-soc-border bg-soc-base px-3 py-1.5 font-mono text-xs text-gray-300"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className={sectionBase}>
      <div className={`${container} max-w-3xl`}>
        <SectionHeading
          id="faq-title"
          kicker="FAQ"
          title="Frequently asked questions"
        />
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.key}
              className="group rounded-xl border border-soc-border bg-soc-card transition-colors open:border-soc-accent/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 text-left font-heading text-base font-semibold text-white hover:text-soc-accent [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-semibold">{item.q}</h3>
                <ChevronDown
                  size={20}
                  aria-hidden
                  className="shrink-0 text-gray-400 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-gray-400">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Final call to action                                                        */
/* -------------------------------------------------------------------------- */

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="pb-20 md:pb-28">
      <div className={container}>
        <div className="relative overflow-hidden rounded-2xl border border-soc-accent/30 bg-soc-card px-6 py-14 text-center md:px-12 md:py-20">
          <div
            aria-hidden
            className="soc-grid-bg pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_80%_at_50%_0%,#000,transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-soc-accent to-transparent"
          />
          <div className="relative">
            <h2
              id="cta-title"
              className="mx-auto max-w-2xl font-heading text-3xl font-bold tracking-tight text-white [text-wrap:balance] md:text-4xl"
            >
              Run your own SOC dashboard
            </h2>
            <p className={`${lead} mx-auto mt-4 max-w-xl`}>
              Open the dashboard to see detection in action, or clone the repo
              and self-host the full stack.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={DASHBOARD_PATH} className={primaryBtn}>
                Open the dashboard
                <ArrowRight size={16} aria-hidden />
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryBtn}
              >
                <Github size={16} aria-hidden />
                Star on GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
