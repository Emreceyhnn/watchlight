"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Sliders, Plus, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface RulesViewProps {
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

export function RulesView({ authFetch }: RulesViewProps) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/rules");
      if (res.ok) {
        const json = await res.json();
        setRules(json.data || []);
      } else {
        setError("Failed to fetch SIEM rules from API.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch rules");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return (
    <div className="rounded-lg border border-soc-border bg-soc-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-soc-border pb-4">
        <div>
          <h2 className="text-base font-heading font-semibold text-gray-100 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-soc-accent" />
            <span>SIEM Detection Rules</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Sliding window threshold detection rules &amp; MITRE ATT&amp;CK correlation logic
          </p>
        </div>

        <button
          onClick={fetchRules}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-soc-panel hover:bg-soc-elevated border border-soc-border text-xs font-mono text-gray-200 transition self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Reload Rules</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs font-mono">
          Loading SIEM detection rules...
        </div>
      ) : error ? (
        <div className="text-center py-12 text-soc-critical text-xs font-mono">
          {error}
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-xs font-mono">
          No detection rules defined in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-lg border border-soc-border bg-soc-base/70 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-gray-100">{rule.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {rule.description || "Automated SIEM sliding window correlation rule."}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                    rule.enabled
                      ? "bg-soc-success/15 text-soc-success border border-soc-success/40"
                      : "bg-soc-panel text-gray-500 border border-soc-border"
                  }`}
                >
                  {rule.enabled ? "ACTIVE" : "DISABLED"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-soc-border/80">
                <div>
                  <span className="text-gray-500">EventType: </span>
                  <span className="text-soc-accent">{rule.eventType}</span>
                </div>
                <div>
                  <span className="text-gray-500">Severity: </span>
                  <span
                    className={
                      rule.severity === "CRITICAL"
                        ? "text-soc-critical font-bold"
                        : rule.severity === "HIGH"
                        ? "text-soc-high font-bold"
                        : "text-soc-accent"
                    }
                  >
                    {rule.severity}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Threshold: </span>
                  <span className="text-gray-200">
                    &gt;= {rule.threshold} in {rule.windowSec}s
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">MITRE: </span>
                  <span className="text-soc-accent">
                    {rule.attackTechnique || "T1110"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

