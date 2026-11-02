"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Radio,
  Activity,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Globe,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Leaflet SSR hydration hatasını önlemek için dinamik import
const ThreatMap = dynamic(() => import("@/components/ThreatMap"), {
  ssr: false,
  loading: () => (
    <div className="h-80 rounded-xl border border-soc-border bg-soc-panel flex items-center justify-center text-gray-500 font-mono text-xs">
      Loading Threat Map Engine…
    </div>
  ),
});

interface DashboardProps {
  stats: any;
  liveEvents: any[];
  alerts: any[];
  onOpenIncidentModal: (alert: any) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#F43F5E",
  HIGH: "#F59E0B",
  MEDIUM: "#EAB308",
  LOW: "#5B8CFF",
};

const SEVERITY_BORDER: Record<string, string> = {
  CRITICAL: "border-l-soc-critical",
  HIGH: "border-l-soc-high",
  MEDIUM: "border-l-soc-medium",
  LOW: "border-l-soc-low",
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-soc-critical/15 text-soc-critical border-soc-critical/30",
  HIGH: "bg-soc-high/15 text-soc-high border-soc-high/30",
  MEDIUM: "bg-soc-medium/15 text-soc-medium border-soc-medium/30",
  LOW: "bg-soc-low/15 text-soc-low border-soc-low/30",
};

const PRIORITY_BADGE: Record<string, string> = {
  P1: "bg-soc-critical/15 text-soc-critical border-soc-critical/30",
  P2: "bg-soc-high/15 text-soc-high border-soc-high/30",
  P3: "bg-soc-medium/15 text-soc-medium border-soc-medium/30",
  P4: "bg-soc-low/15 text-soc-low border-soc-low/30",
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-soc-critical/15 text-soc-critical border-soc-critical/30",
  INVESTIGATING: "bg-soc-high/15 text-soc-high border-soc-high/30",
  CONTAINMENT: "bg-soc-accent/15 text-soc-accent border-soc-accent/30",
  RESOLVED: "bg-soc-success/15 text-soc-success border-soc-success/30",
};

function timeAgo(iso?: string) {
  if (!iso) return "—";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function DashboardView({
  stats,
  liveEvents,
  alerts,
  onOpenIncidentModal,
}: DashboardProps) {
  const [chartData, setChartData] = useState([
    { time: "-5m", eps: 420 },
    { time: "-4m", eps: 680 },
    { time: "-3m", eps: 510 },
    { time: "-2m", eps: 890 },
    { time: "-1m", eps: 1140 },
    { time: "Now", eps: stats?.summary?.eps || 950 },
  ]);

  useEffect(() => {
    if (stats?.summary?.eps) {
      setChartData((prev) => [...prev.slice(1), { time: "Now", eps: stats.summary.eps }]);
    }
  }, [stats?.summary?.eps]);

  const pieData = Object.entries(
    stats?.severityDistribution || { CRITICAL: 1, HIGH: 3, MEDIUM: 5, LOW: 2 }
  ).map(([name, value]) => ({ name, value: Number(value) }));

  const openAlerts = alerts.filter((a) => a.status === "OPEN");
  const crit = openAlerts.filter((a) => a.severity === "CRITICAL").length;
  const high = openAlerts.filter((a) => a.severity === "HIGH").length;
  const med = openAlerts.filter((a) => a.severity === "MEDIUM" || a.severity === "LOW").length;
  const topTechnique =
    alerts.find((a) => a.rule?.attackTechnique)?.rule || { attackTechnique: "T1110.001", attackName: "Brute Force" };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-soc-border bg-soc-panel p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
              Events/sec
            </span>
            <Radio className="h-4 w-4 text-soc-accent" strokeWidth={1.75} />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="font-mono text-2xl font-bold text-white">
                {(stats?.summary?.eps ?? 14820).toLocaleString()}
              </span>
              <span className="ml-1 text-xs text-gray-500">eps</span>
            </div>
            <div className="h-8 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <Area
                    type="monotone"
                    dataKey="eps"
                    stroke="#5B8CFF"
                    strokeWidth={1.5}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-soc-border-soft text-[11px] font-mono text-gray-500">
            Pipeline latency: 12ms
          </div>
        </div>

        <div className="rounded-xl border border-soc-border bg-soc-panel p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
              Open Alerts
            </span>
            <AlertTriangle className="h-4 w-4 text-soc-high" strokeWidth={1.75} />
          </div>
          <div className="font-mono text-2xl font-bold text-soc-high">
            {stats?.summary?.activeAlerts ?? openAlerts.length}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-soc-border-soft flex items-center gap-3 text-[11px] font-mono text-gray-500">
            <span className="text-soc-critical">{crit} Crit</span>
            <span className="text-soc-high">{high} High</span>
            <span className="text-soc-medium">{med} Med</span>
          </div>
        </div>

        <div className="rounded-xl border border-soc-border bg-soc-panel p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
              Active Incidents
            </span>
            <Flame className="h-4 w-4 text-soc-critical" strokeWidth={1.75} />
          </div>
          <div className="font-mono text-2xl font-bold text-soc-critical">
            {stats?.summary?.openIncidents ?? 0}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-soc-border-soft text-[11px] font-mono text-gray-500">
            Assigned to SOC analysts
          </div>
        </div>

        <div className="rounded-xl border border-soc-border bg-soc-panel p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
              Top Technique
            </span>
            <Activity className="h-4 w-4 text-soc-success" strokeWidth={1.75} />
          </div>
          <div className="font-mono text-sm font-bold text-soc-success truncate">
            {topTechnique.attackTechnique}
          </div>
          <div className="text-xs text-gray-300 truncate">{topTechnique.attackName || "—"}</div>
          <div className="mt-2 pt-2 border-t border-soc-border-soft text-[11px] font-mono text-gray-500">
            {alerts.length} occurrences
          </div>
        </div>
      </div>

      {/* Live Alert Feed + Threat Map */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-xl border border-soc-border bg-soc-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-semibold text-white flex items-center gap-2">
              Live Alert Feed
              <span className="rounded-md border border-soc-border bg-soc-card px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
                {alerts.length} in queue
              </span>
            </h3>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-soc-success">
              <span className="h-1.5 w-1.5 rounded-full bg-soc-success animate-pulse" />
              Stream On
            </span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs font-mono">
                No active alerts in queue. System secure.
              </div>
            ) : (
              alerts.slice(0, 8).map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg border border-soc-border-soft bg-soc-card border-l-[3px] ${
                    SEVERITY_BORDER[alert.severity] || "border-l-soc-low"
                  } p-3.5`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`shrink-0 px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${
                          SEVERITY_BADGE[alert.severity] || SEVERITY_BADGE.LOW
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-gray-100 truncate">
                        {alert.rule?.name || "Security Anomaly"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-gray-500">{timeAgo(alert.createdAt)}</span>
                      {alert.rule?.attackTechnique && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-soc-elevated text-soc-accent border border-soc-accent/20">
                          {alert.rule.attackTechnique}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] font-mono text-gray-500 truncate">
                      SRC: <span className="text-gray-300">{alert.sourceIp}</span>
                      <span className="mx-1.5 text-gray-700">·</span>
                      Events: <span className="text-soc-accent">{alert.eventCount}</span>
                    </div>
                    {alert.status === "OPEN" ? (
                      <button
                        onClick={() => onOpenIncidentModal(alert)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-soc-accent text-white hover:bg-soc-accent/90 transition"
                      >
                        Create Incident <ArrowUpRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 text-[11px] font-mono rounded bg-soc-success/10 text-soc-success border border-soc-success/30">
                        {alert.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Threat Origins panel */}
        <div className="rounded-xl border border-soc-border bg-soc-panel p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-soc-critical" strokeWidth={1.75} />
              Threat Origins
            </h3>
          </div>
          <div className="rounded-lg overflow-hidden border border-soc-border-soft">
            <ThreatMap alerts={alerts} />
          </div>
          <div className="mt-4 flex items-center gap-4 text-[11px] font-mono text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-soc-critical" /> Critical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-soc-high" /> High Volume
            </span>
          </div>

          {/* Severity distribution mini donut */}
          <div className="mt-4 pt-4 border-t border-soc-border-soft">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={24} outerRadius={38} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || "#5B8CFF"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#141A22", borderColor: "#222A35", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono min-w-0">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: SEVERITY_COLORS[d.name] }} />
                    <span className="text-gray-500 truncate">{d.name}</span>
                    <span className="text-gray-200 font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Incidents table */}
      <div className="rounded-xl border border-soc-border bg-soc-panel overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-4">
          <h3 className="font-heading text-sm font-semibold text-white">Recent Incidents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-soc-border-soft text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                <th className="py-2.5 px-5 font-medium">Priority</th>
                <th className="py-2.5 px-3 font-medium">Title</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Assignee</th>
                <th className="py-2.5 px-3 font-medium">Technique</th>
                <th className="py-2.5 px-5 font-medium text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border-soft">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 text-xs font-mono">
                    No escalated incidents.
                  </td>
                </tr>
              ) : (
                alerts.slice(0, 6).map((alert) => (
                  <tr key={alert.id} className="text-xs hover:bg-soc-elevated/60 transition-colors">
                    <td className="py-3 px-5">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${
                          PRIORITY_BADGE[alert.severity === "CRITICAL" ? "P1" : alert.severity === "HIGH" ? "P2" : "P3"]
                        }`}
                      >
                        {alert.severity === "CRITICAL" ? "P1" : alert.severity === "HIGH" ? "P2" : "P3"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-200 font-medium max-w-xs truncate">
                      {alert.rule?.name || "Security Anomaly"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-mono ${
                          STATUS_BADGE[alert.status] || STATUS_BADGE.OPEN
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-400 font-mono">{alert.assignee || "Unassigned"}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-soc-elevated text-soc-accent border border-soc-accent/20">
                        {alert.rule?.attackTechnique || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right text-gray-500 font-mono">{timeAgo(alert.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
