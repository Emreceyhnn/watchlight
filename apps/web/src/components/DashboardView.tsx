"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  ShieldAlert,
  Radio,
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ExternalLink,
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
  BarChart,
  Bar,
} from "recharts";

// Leaflet SSR hydration hatasını önlemek için dinamik import
const ThreatMap = dynamic(() => import("@/components/ThreatMap"), {
  ssr: false,
  loading: () => (
    <div className="h-96 rounded-lg border border-soc-border bg-soc-card flex items-center justify-center text-gray-500 font-mono text-xs">
      Loading Threat Map Engine...
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
  MEDIUM: "#5B8CFF",
  LOW: "#22D3A8",
};

export function DashboardView({
  stats,
  liveEvents,
  alerts,
  onOpenIncidentModal,
}: DashboardProps) {
  // Dinamik istemci zaman serisi üretimi (son 6 nokta)
  const [chartData, setChartData] = useState(() => {
    const points = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 1000);
      const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      points.push({ time: timeStr, eps: Math.max(120, Math.floor((stats?.summary?.eps || 420) * (0.8 + Math.random() * 0.4))) });
    }
    return points;
  });

  const [peakEps, setPeakEps] = useState(() => Math.max(1250, stats?.summary?.eps || 420));

  useEffect(() => {
    if (stats?.summary?.eps !== undefined) {
      const currentEps = stats.summary.eps;
      setPeakEps((prev) => Math.max(prev, currentEps));

      setChartData((prev) => {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const next = [...prev.slice(1), { time: timeStr, eps: currentEps }];
        return next;
      });
    }
  }, [stats?.summary?.eps]);

  const pieData = Object.entries(stats?.severityDistribution || { CRITICAL: 1, HIGH: 3, MEDIUM: 5, LOW: 2 }).map(
    ([name, value]) => ({ name, value: Number(value) })
  );

  const openAlerts = alerts.filter((a) => a.status === "OPEN");
  const criticalCount = openAlerts.filter((a) => a.severity === "CRITICAL").length;
  const highCount = openAlerts.filter((a) => a.severity === "HIGH").length;
  const otherCount = openAlerts.length - criticalCount - highCount;

  return (
    <div className="space-y-5">
      {/* 1. KPI Kartları */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Ingestion */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-3.5 flex flex-col justify-between hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-medium text-gray-400 uppercase tracking-wider">
              Events/sec
            </span>
            <Radio className="h-4 w-4 text-soc-accent" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="font-heading font-bold text-2xl text-gray-100 tracking-tight">
              {(stats?.summary?.totalEvents || 0).toLocaleString()}
            </span>
            <span className="font-mono text-xs text-gray-400">events</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-soc-border/60 font-mono text-[11px] text-gray-400">
            <span>Live Redis Ingest</span>
            <span className="text-soc-accent">● streaming</span>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-3.5 flex flex-col justify-between hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-medium text-gray-400 uppercase tracking-wider">
              Open Alerts
            </span>
            <AlertTriangle className="h-4 w-4 text-soc-high" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="font-heading font-bold text-2xl text-soc-high tracking-tight">
              {stats?.summary?.activeAlerts ?? openAlerts.length}
            </span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="h-2 w-2 rounded-full bg-soc-critical inline-block" />
              <span className="text-gray-300 font-medium mr-1.5">{criticalCount}</span>
              <span className="h-2 w-2 rounded-full bg-soc-high inline-block" />
              <span className="text-gray-300 font-medium mr-1.5">{highCount}</span>
              <span className="h-2 w-2 rounded-full bg-soc-accent inline-block" />
              <span className="text-gray-300 font-medium">{Math.max(otherCount, 0)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-soc-border/60 font-mono text-[11px] text-gray-400">
            <span>Breakdown:</span>
            <span className="text-gray-300">
              {criticalCount} Crit &middot; {highCount} High
            </span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-3.5 flex flex-col justify-between hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-medium text-gray-400 uppercase tracking-wider">
              Critical Severity
            </span>
            <Flame className="h-4 w-4 text-soc-critical" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-heading font-bold text-2xl text-soc-critical tracking-tight">
              {stats?.summary?.criticalAlerts || 0}
            </span>
            <span className="font-mono text-[11px] text-gray-400">unresolved</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-soc-border/60 font-mono text-[11px] text-gray-400">
            <span>Immediate action required</span>
          </div>
        </div>

        {/* Open Incidents */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-3.5 flex flex-col justify-between hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-medium text-gray-400 uppercase tracking-wider">
              Open Incidents
            </span>
            <Activity className="h-4 w-4 text-soc-success" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-heading font-bold text-2xl text-soc-success tracking-tight">
              {stats?.summary?.openIncidents || 0}
            </span>
            <span className="font-mono text-[11px] text-gray-400">open tickets</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-soc-border/60 font-mono text-[11px] text-gray-400">
            <span>Assigned to SOC Analysts</span>
          </div>
        </div>
      </section>

      {/* 2. Grafikler Katmanı */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* EPS Zaman Serisi */}
        <div className="lg:col-span-2 bg-soc-card border border-soc-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-heading font-semibold text-gray-200 uppercase tracking-wider">
                Event Ingestion Rate (EPS)
              </h3>
              <p className="text-xs text-gray-500 font-mono">Real-time throughput via Sliding Window</p>
            </div>
            <span className="text-xs font-mono text-soc-accent bg-soc-accent/10 px-2 py-0.5 rounded border border-soc-accent/20">
              Peak: {peakEps.toLocaleString()} EPS
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="epsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B8CFF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#5B8CFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#41516B" fontSize={11} />
                <YAxis stroke="#41516B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#141A22", borderColor: "#222A35" }}
                  itemStyle={{ color: "#5B8CFF" }}
                />
                <Area
                  type="monotone"
                  dataKey="eps"
                  stroke="#5B8CFF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#epsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Dağılımı Donut */}
        <div className="bg-soc-card border border-soc-border rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-heading font-semibold text-gray-200 uppercase tracking-wider">
              Alert Severity Matrix
            </h3>
            <p className="text-xs text-gray-500 font-mono">Distribution across active triggers</p>
          </div>
          <div className="h-44 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[entry.name] || "#5B8CFF"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#141A22", borderColor: "#222A35" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[d.name] }}
                />
                <span className="text-gray-400">{d.name}:</span>
                <span className="text-gray-200 font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Coğrafi Tehdit Haritası */}
      <section className="bg-soc-card border border-soc-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-heading font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <span>Threat Geolocation Radar</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-soc-critical/15 text-soc-critical border border-soc-critical/40 font-mono animate-pulse normal-case">
                ATT&amp;CK MAPPED
              </span>
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              Real-time attack origin visualization (Last 15 minutes anomaly clusters)
            </p>
          </div>
        </div>
        <ThreatMap alerts={alerts} />
      </section>

      {/* 4. Canlı Alert Timeline */}
      <section className="bg-soc-card border border-soc-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-heading font-semibold text-gray-200 uppercase tracking-wider">
              Alert Triage Queue
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              Automated correlation alerts with MITRE ATT&amp;CK technique IDs
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs font-mono">
              🛡️ No active alerts in queue. System secure.
            </div>
          ) : (
            alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3.5 rounded-lg border-l-4 bg-soc-base/60 hover:bg-soc-panel/40 transition"
                style={{ borderLeftColor: SEVERITY_COLORS[alert.severity] || "#5B8CFF" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase border"
                    style={{
                      borderColor: SEVERITY_COLORS[alert.severity] || "#5B8CFF",
                      color: SEVERITY_COLORS[alert.severity] || "#5B8CFF",
                      backgroundColor: `${SEVERITY_COLORS[alert.severity]}15`,
                    }}
                  >
                    {alert.severity}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-gray-100 flex items-center gap-2">
                      <span>{alert.rule?.name || "Security Anomaly"}</span>
                      {alert.rule?.attackTechnique && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-soc-accent/10 text-soc-accent border border-soc-accent/30">
                          {alert.rule.attackTechnique}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                      Source IP: <span className="text-gray-300">{alert.sourceIp}</span> • Events:{" "}
                      <span className="text-soc-accent">{alert.eventCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === "OPEN" ? (
                    <button
                      onClick={() => onOpenIncidentModal(alert)}
                      className="px-3 py-1 text-xs font-medium rounded-md bg-soc-accent/10 text-soc-accent border border-soc-accent/30 hover:bg-soc-accent/20 transition flex items-center gap-1.5"
                    >
                      <span>Create Incident</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-mono rounded bg-soc-success/10 text-soc-success border border-soc-success/30">
                      {alert.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
