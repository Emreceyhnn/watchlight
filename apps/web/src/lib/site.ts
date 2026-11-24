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

export const SITE_TITLE = "Watchlight — Mini-SIEM / SOC Dashboard";

export const SITE_DESCRIPTION =
  "Real-time security monitoring, made simple. Rule-based threat detection mapped to MITRE ATT&CK, live alert streaming and full incident triage.";
