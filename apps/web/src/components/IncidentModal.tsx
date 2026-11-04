"use client";

import React, { useState } from "react";
import { X, ShieldAlert } from "lucide-react";
import { IncidentPriority } from "@watchlight/shared";

interface IncidentModalProps {
  alert: any;
  onClose: () => void;
  onIncidentCreated: () => void;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const PRIORITY_OPTIONS: { value: IncidentPriority; label: string; color: string }[] = [
  { value: "P1", label: "P1 — Critical (Immediate)", color: "text-soc-critical" },
  { value: "P2", label: "P2 — High (2 Hours)", color: "text-soc-high" },
  { value: "P3", label: "P3 — Medium (8 Hours)", color: "text-soc-medium" },
  { value: "P4", label: "P4 — Low (24 Hours)", color: "text-soc-low" },
];

export function IncidentModal({ alert, onClose, onIncidentCreated, authFetch }: IncidentModalProps) {
  const [title, setTitle] = useState(`[${alert?.severity || "HIGH"}] ${alert?.rule?.name || "Security Anomaly"} - ${alert?.sourceIp}`);
  const [summary, setSummary] = useState(
    `Detected ${alert?.eventCount || 1} anomalous security event(s) originating from source IP ${alert?.sourceIp}. Aligned with MITRE ATT&CK technique ${alert?.rule?.attackTechnique || "T1110"}.`
  );
  const [priority, setPriority] = useState<IncidentPriority>("P2");
  const [assignee, setAssignee] = useState("Emre Ceyhan (Lead Analyst)");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authFetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: alert.id,
          title,
          summary,
          priority,
          assignee,
        }),
      });

      if (res.ok) {
        onIncidentCreated();
        onClose();
      }
    } catch (err) {
      console.error("Failed to create incident:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-soc-border bg-soc-panel shadow-2xl relative">
        <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-soc-accent/80 to-transparent" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-soc-border-soft">
          <div className="flex items-center gap-2 text-soc-accent font-heading font-semibold text-sm">
            <ShieldAlert className="h-4 w-4" />
            <span>Escalate Alert to Incident</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Incident Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-soc-border bg-soc-card px-3 py-2.5 text-xs text-white focus:border-soc-accent focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority SLA</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                className="w-full rounded-lg border border-soc-border bg-soc-card px-3 py-2.5 text-xs text-white focus:border-soc-accent focus:outline-none transition-colors"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Assignee</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full rounded-lg border border-soc-border bg-soc-card px-3 py-2.5 text-xs text-white focus:border-soc-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Triage Summary & Notes</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-lg border border-soc-border bg-soc-card px-3 py-2.5 text-xs text-white focus:border-soc-accent focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-soc-border-soft">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-soc-border text-gray-400 hover:bg-soc-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-soc-accent text-white hover:bg-soc-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating…" : "Confirm & Create Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
