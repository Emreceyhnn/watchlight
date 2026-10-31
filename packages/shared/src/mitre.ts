export interface MitreTechnique {
  id: string; // Örn: T1110.001
  name: string;
  tactic: string;
  description: string;
  url: string;
}

export const MITRE_ATTACK_TACTICS = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Exfiltration",
  "Command and Control",
  "Impact",
] as const;

export type MitreTactic = (typeof MITRE_ATTACK_TACTICS)[number];

export const DEFAULT_MITRE_TECHNIQUES: Record<string, MitreTechnique> = {
  "T1110.001": {
    id: "T1110.001",
    name: "Password Guessing (Brute Force)",
    tactic: "Credential Access",
    description: "Adversaries may aggressively try passwords against known accounts to gain unauthorized access.",
    url: "https://attack.mitre.org/techniques/T1110/001/",
  },
  "T1110.004": {
    id: "T1110.004",
    name: "Credential Stuffing",
    tactic: "Credential Access",
    description: "Adversaries may test credentials stolen from other breaches across multiple accounts.",
    url: "https://attack.mitre.org/techniques/T1110/004/",
  },
  "T1078": {
    id: "T1078",
    name: "Valid Accounts (Impossible Travel / Unauthorized Admin)",
    tactic: "Defense Evasion",
    description: "Adversaries may use legitimate credentials across geolocations or privilege tiers to avoid detection.",
    url: "https://attack.mitre.org/techniques/T1078/",
  },
  "T1046": {
    id: "T1046",
    name: "Network Service Discovery (Port Scan)",
    tactic: "Discovery",
    description: "Adversaries may enumerate open ports and running network services on the target infrastructure.",
    url: "https://attack.mitre.org/techniques/T1046/",
  },
  "T1048": {
    id: "T1048",
    name: "Exfiltration Over Alternative Protocol (Data Exfiltration)",
    tactic: "Exfiltration",
    description: "Adversaries may steal sensitive data by exfiltrating it over atypical networks or high bandwidth channels.",
    url: "https://attack.mitre.org/techniques/T1048/",
  },
  "T1071": {
    id: "T1071",
    name: "Application Layer Protocol (API Abuse)",
    tactic: "Command and Control",
    description: "Adversaries may flood or abuse application layer APIs to degrade service or harvest data.",
    url: "https://attack.mitre.org/techniques/T1071/",
  },
};
