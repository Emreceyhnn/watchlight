"use client";

import React, { useState } from "react";
import { X, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import { IncidentPriority } from "@watchlight/shared";

interface IncidentModalProps {
  alert: any;
  onClose: () => void;
  onIncidentCreated: () => void;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

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
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <ShieldAlert className="h-4 w-4" />
            <span>Escalate Alert to Incident</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Incident Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">Priority SLA</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="P1">P1 - Critical (Immediate)</option>
                <option value="P2">P2 - High (2 Hours)</option>
                <option value="P3">P3 - Medium (8 Hours)</option>
                <option value="P4">P4 - Low (24 Hours)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">Assignee</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Triage Summary & Notes</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg border border-gray-800 text-gray-400 hover:bg-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 font-semibold transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Confirm & Create Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
