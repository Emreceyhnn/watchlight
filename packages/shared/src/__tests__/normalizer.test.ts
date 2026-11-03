import { describe, it, expect } from "vitest";
import { parseRawLog } from "../normalizer";

describe("Log Normalizer & Parser Suite", () => {
  it("başarısız SSH login denemesini AUTH_FAILED olarak doğru parse etmeli", () => {
    const raw = "Oct 31 21:04:12 soc-server sshd[1234]: Failed password for invalid user root from 185.220.101.5 port 44322 ssh2";
    const res = parseRawLog({ raw, sourceType: "auth_log" });

    expect(res).not.toBeNull();
    expect(res?.type).toBe("AUTH_FAILED");
    expect(res?.sourceIp).toBe("185.220.101.5");
    expect(res?.username).toBe("root");
  });

  it("başarılı SSH login oturumunu AUTH_LOGIN olarak doğru parse etmeli", () => {
    const raw = "Oct 31 21:04:15 soc-server sshd[1235]: Accepted password for analyst_emre from 192.168.1.50 port 51234 ssh2";
    const res = parseRawLog({ raw, sourceType: "auth_log" });

    expect(res).not.toBeNull();
    expect(res?.type).toBe("AUTH_LOGIN");
    expect(res?.sourceIp).toBe("192.168.1.50");
    expect(res?.username).toBe("analyst_emre");
  });

  it("yüksek boyutlu (>50MB) Nginx GET isteğini DATA_TRANSFER exfiltration olarak işaretlemeli", () => {
    const raw = '45.154.255.89 - - [31/Oct/2026:21:05:00 +0300] "GET /api/backup.sql HTTP/1.1" 200 62914560 "-" "curl/7.88.1"';
    const res = parseRawLog({ raw, sourceType: "nginx" });

    expect(res).not.toBeNull();
    expect(res?.type).toBe("DATA_TRANSFER");
    expect(res?.sourceIp).toBe("45.154.255.89");
    expect((res?.payload as any)?.bytes).toBe(62914560);
  });

  it("standart API çağrısını API_CALL olarak parse etmeli", () => {
    const raw = '10.0.0.12 - - [31/Oct/2026:21:05:10 +0300] "GET /api/events HTTP/1.1" 200 450 "-" "Mozilla/5.0"';
    const res = parseRawLog({ raw, sourceType: "nginx" });

    expect(res).not.toBeNull();
    expect(res?.type).toBe("API_CALL");
    expect(res?.sourceIp).toBe("10.0.0.12");
  });
});

