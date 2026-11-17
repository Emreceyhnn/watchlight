import { describe, it, expect } from "vitest";
import {
  DEFAULT_MITRE_TECHNIQUES,
  MITRE_ATTACK_TACTICS,
} from "../mitre";

const entries = Object.entries(DEFAULT_MITRE_TECHNIQUES);

describe("MITRE ATT&CK reference data", () => {
  it("contains the expected tactic list", () => {
    expect(MITRE_ATTACK_TACTICS).toHaveLength(12);
    expect(MITRE_ATTACK_TACTICS).toContain("Credential Access");
    expect(MITRE_ATTACK_TACTICS).toContain("Exfiltration");
  });

  it("has at least one default technique", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s has a key that matches its id", (key, technique) => {
    expect(technique.id).toBe(key);
  });

  it.each(entries)("%s uses a known tactic", (_key, technique) => {
    expect(MITRE_ATTACK_TACTICS).toContain(technique.tactic);
  });

  it.each(entries)("%s links to the official MITRE site", (_key, technique) => {
    expect(technique.url).toMatch(/^https:\/\/attack\.mitre\.org\/techniques\//);
  });

  it.each(entries)("%s has a non-empty name and description", (_key, technique) => {
    expect(technique.name.trim()).not.toBe("");
    expect(technique.description.trim()).not.toBe("");
  });
});
