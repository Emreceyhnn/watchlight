"use client";

import React, { useState } from "react";
import { AlertTriangle, Shield, CheckCircle, Clock, ExternalLink } from "lucide-react";

interface AlertsViewProps {
  alerts: any[];
  onOpenIncidentModal: (alert: any) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "border-soc-critical/40 bg-soc-critical/10 text-soc-critical",
  HIGH: "border-soc-high/40 bg-soc-high/10 text-soc-high",
  MEDIUM: "border-soc-accent/40 bg-soc-accent/10 text-soc-accent",
  LOW: "border-soc-success/40 bg-soc-success/10 text-soc-success",
};

export function AlertsView({ alerts, onOpenIncidentModal }: AlertsViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== "ALL" && alert.severity !== filterSeverity) return false;
    if (filterStatus !== "ALL" && alert.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="rounded-lg border border-soc-border bg-soc-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-soc-border pb-4">
        <div>
          <h2 className="text-base font-heading font-semibold text-gray-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-soc-high" />
            <span>SIEM Security Alerts Queue</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Real-time correlation alerts aggregated across sliding windows
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-soc-base border border-soc-border rounded px-2.5 py-1 text-xs text-gray-300 outline-none focus:border-soc-accent"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-soc-base border border-soc-border rounded px-2.5 py-1 text-xs text-gray-300 outline-none focus:border-soc-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="TRIAGED">Triaged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-xs font-mono">
          No alerts match the selected criteria.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 rounded-lg border border-soc-border bg-soc-base/70 hover:border-gray-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      SEVERITY_COLORS[alert.severity] || "border-soc-border bg-soc-panel text-gray-400"
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-sm font-semibold text-gray-200">
                    {alert.rule?.name || alert.title || "Correlation Alert"}
                  </span>
                  {alert.rule?.attackTechnique && (
                    <span className="text-[10px] font-mono text-soc-accent bg-soc-accent/10 px-1.5 py-0.5 rounded border border-soc-accent/30">
                      MITRE {alert.rule.attackTechnique}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-gray-400">
                  <span>Source IP: <strong className="text-gray-200">{alert.sourceIp}</strong></span>
                  <span>Events: <strong className="text-gray-200">{alert.eventCount}</strong></span>
                  <span>Target: <strong className="text-gray-200">{alert.targetHost || "cluster"}</strong></span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-soc-panel border border-soc-border text-gray-300">
                  {alert.status}
                </span>
                <button
                  onClick={() => onOpenIncidentModal(alert)}
                  className="px-2.5 py-1 rounded bg-soc-accent/15 text-soc-accent border border-soc-accent/30 text-xs font-mono hover:bg-soc-accent/25 transition flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  <span>Triage</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

