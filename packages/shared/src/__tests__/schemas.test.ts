import { describe, it, expect } from "vitest";
import { IngestEventPayloadSchema, LoginInputSchema, DEFAULT_MITRE_TECHNIQUES } from "../index";

describe("Shared Schemas & MITRE Matrix Validation", () => {
  it("validates a valid SecurityEvent schema without errors", () => {
    const validEvent = {
      timestamp: new Date().toISOString(),
      type: "AUTH_FAILED",
      sourceIp: "185.220.101.5",
      destinationIp: "192.168.1.1",
      username: "root",
      country: "RU",
      payload: { attempt: 1 },
    };

    const res = IngestEventPayloadSchema.safeParse(validEvent);
    expect(res.success).toBe(true);
  });

  it("produces a Zod error for an invalid IP or missing required fields", () => {
    const invalidEvent = {
      type: "INVALID_EVENT_TYPE",
      sourceIp: "",
    };

    const res = IngestEventPayloadSchema.safeParse(invalidEvent);
    expect(res.success).toBe(false);
  });

  it("validates LoginInputSchema email format and password length", () => {
    const invalidLogin = { email: "not-an-email", password: "123" };
    const res = LoginInputSchema.safeParse(invalidLogin);
    expect(res.success).toBe(false);

    const validLogin = { email: "analyst@watchlight.soc", password: "SecurePassword2026!" };
    const resValid = LoginInputSchema.safeParse(validLogin);
    expect(resValid.success).toBe(true);
  });

  it("validates that core MITRE ATT&CK techniques are defined", () => {
    const t1110 = DEFAULT_MITRE_TECHNIQUES["T1110.001"];
    expect(t1110).toBeDefined();
    expect(t1110?.name).toContain("Password Guessing");
    expect(t1110?.tactic).toBe("Credential Access");

    const t1046 = DEFAULT_MITRE_TECHNIQUES["T1046"];
    expect(t1046).toBeDefined();
    expect(t1046?.name).toContain("Network Service Discovery");
  });
});

