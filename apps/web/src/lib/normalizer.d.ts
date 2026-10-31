import { IngestEventPayload } from "@watchlight/shared";
export interface RawLogEntry {
    raw: string;
    sourceType: "nginx" | "auth_log" | "generic_json";
}
/**
 * Basit dahili IP -> Ülke tahminleme (Demo ve offline SOC çalışması için)
 */
export declare function lookupGeoCountry(ip: string): string;
export declare function parseRawLog(entry: RawLogEntry): IngestEventPayload | null;
//# sourceMappingURL=normalizer.d.ts.map