import { EventType, IngestEventPayload } from "./schemas";

export interface RawLogEntry {
  raw: string;
  sourceType: "nginx" | "auth_log" | "generic_json";
}

/**
 * Nginx Combined Log Parser:
 * format: $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
 */
const NGINX_REGEX =
  /^(\S+)\s+-\s+(\S+)\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+([^"]*)"\s+(\d{3})\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"/;

/**
 * Linux /var/log/auth.log (sshd) Parser:
 * Örnek: "Failed password for invalid user root from 192.168.1.100 port 45123 ssh2"
 * Örnek: "Accepted password for ubuntu from 192.168.1.50 port 51234 ssh2"
 */
const SSHD_FAILED_REGEX =
  /Failed password for (?:invalid user )?(\S+) from (\S+) port (\d+)/i;
const SSHD_ACCEPTED_REGEX =
  /Accepted (?:password|publickey) for (\S+) from (\S+) port (\d+)/i;

/**
 * Basit dahili IP -> Ülke tahminleme (Demo ve offline SOC çalışması için)
 */
export function lookupGeoCountry(ip: string): string {
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip === "127.0.0.1") {
    return "TR";
  }
  // Deterministic hash tabanlı ülke atama (demo simülasyonları için tutarlı)
  const countries = ["TR", "US", "DE", "RU", "CN", "GB", "NL", "FR", "JP", "BR"];
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash |= 0;
  }
  return countries[Math.abs(hash) % countries.length];
}

export function parseRawLog(entry: RawLogEntry): IngestEventPayload | null {
  const { raw, sourceType } = entry;

  try {
    if (sourceType === "auth_log") {
      const failedMatch = raw.match(SSHD_FAILED_REGEX);
      if (failedMatch) {
        const username = failedMatch[1];
        const sourceIp = failedMatch[2];
        const sourcePort = parseInt(failedMatch[3], 10);

        return {
          type: "AUTH_FAILED" as EventType,
          sourceIp,
          sourcePort,
          username,
          geoCountry: lookupGeoCountry(sourceIp),
          payload: { rawLog: raw },
        };
      }

      const acceptedMatch = raw.match(SSHD_ACCEPTED_REGEX);
      if (acceptedMatch) {
        const username = acceptedMatch[1];
        const sourceIp = acceptedMatch[2];
        const sourcePort = parseInt(acceptedMatch[3], 10);

        return {
          type: "AUTH_LOGIN" as EventType,
          sourceIp,
          sourcePort,
          username,
          geoCountry: lookupGeoCountry(sourceIp),
          payload: { rawLog: raw },
        };
      }
    }

    if (sourceType === "nginx") {
      const match = raw.match(NGINX_REGEX);
      if (match) {
        const sourceIp = match[1];
        const method = match[4];
        const path = match[5];
        const status = parseInt(match[7], 10);
        const bytes = parseInt(match[8], 10);
        const userAgent = match[10];

        let type: EventType = "API_CALL";
        if (bytes > 50 * 1024 * 1024) {
          type = "DATA_TRANSFER";
        } else if (status === 401 || status === 403) {
          type = "AUTH_FAILED";
        }

        return {
          type,
          sourceIp,
          path,
          userAgent,
          geoCountry: lookupGeoCountry(sourceIp),
          payload: { method, status, bytes, rawLog: raw },
        };
      }
    }

    if (sourceType === "generic_json") {
      const parsed = JSON.parse(raw);
      if (parsed.sourceIp && parsed.type) {
        return {
          ...parsed,
          geoCountry: parsed.geoCountry || lookupGeoCountry(parsed.sourceIp),
        };
      }
    }
  } catch (err) {
    console.error("[Parser] Error parsing log entry:", err);
  }

  return null;
}
