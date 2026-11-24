const DEFAULT_SITE_URL = "https://watchlight.emreceyhan.xyz";

/**
 * Canonical public origin, without a trailing slash.
 * sitemap.xml and robots.txt are prerendered at build time, and the Docker
 * build has no NEXT_PUBLIC_APP_URL, so the fallback is the production domain
 * rather than localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL
).replace(/\/+$/, "");

export const SITE_NAME = "Watchlight";

export const SITE_TITLE = "Watchlight — Open-Source Mini-SIEM & SOC Dashboard";

export const SITE_DESCRIPTION =
  "Open-source mini-SIEM with real-time detection, MITRE ATT&CK-mapped alerts, live streaming and incident triage. Self-host with Next.js, Redis and PostgreSQL.";

export const GITHUB_URL = "https://github.com/Emreceyhnn/watchlight";

/** The sign-in screen and SOC dashboard live here; "/" is the landing page. */
export const DASHBOARD_PATH = "/dashboard";
