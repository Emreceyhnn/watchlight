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
    <div className="h-96 rounded-xl border border-gray-800 bg-gray-900/40 flex items-center justify-center text-gray-500 font-mono text-xs">
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
  CRITICAL: "#EF4444",
  HIGH: "#F59E0B",
  MEDIUM: "#3B82F6",
  LOW: "#10B981",
};

export function DashboardView({
  stats,
  liveEvents,
  alerts,
  onOpenIncidentModal,
}: DashboardProps) {
  // Zaman serisi simülasyon grafiği verisi (1 dakikalık pencereler)
  const [chartData, setChartData] = useState([
    { time: "21:00", eps: 420 },
    { time: "21:10", eps: 680 },
    { time: "21:20", eps: 510 },
    { time: "21:30", eps: 890 },
    { time: "21:40", eps: 1140 },
    { time: "21:45", eps: stats?.summary?.eps || 950 },
  ]);

  useEffect(() => {
    if (stats?.summary?.eps) {
      setChartData((prev) => {
        const next = [...prev.slice(1), { time: "Now", eps: stats.summary.eps }];
        return next;
      });
    }
  }, [stats?.summary?.eps]);

  const pieData = Object.entries(stats?.severityDistribution || { CRITICAL: 1, HIGH: 3, MEDIUM: 5, LOW: 2 }).map(
    ([name, value]) => ({ name, value: Number(value) })
  );

  return (
    <div className="space-y-6">
      {/* 1. KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingestion */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 relative overflow-hidden backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">TOTAL EVENTS</span>
            <Radio className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {(stats?.summary?.totalEvents || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1 flex items-center gap-1">
            <span>● Live Redis Ingest</span>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 relative overflow-hidden backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">ACTIVE ALERTS</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {stats?.summary?.activeAlerts || alerts.filter((a) => a.status === "OPEN").length}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">Pending Triage</div>
        </div>

        {/* Critical Alerts */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 relative overflow-hidden backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">CRITICAL SEVERITY</span>
            <Flame className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {stats?.summary?.criticalAlerts || 0}
          </div>
          <div className="text-[11px] text-red-400/80 mt-1">Immediate Action Required</div>
        </div>

        {/* Open Incidents */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 relative overflow-hidden backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">OPEN INCIDENTS</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats?.summary?.openIncidents || 0}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Assigned to SOC Analysts</div>
        </div>
      </div>

      {/* 2. Grafikler Katmanı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* EPS Zaman Serisi */}
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900/50 p-5 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Event Ingestion Rate (EPS)</h3>
              <p className="text-xs text-gray-500 font-mono">Real-time throughput via Sliding Window</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
              Peak: 1,250 EPS
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="epsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#4B5563" fontSize={11} />
                <YAxis stroke="#4B5563" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }}
                  itemStyle={{ color: "#22D3EE" }}
                />
                <Area
                  type="monotone"
                  dataKey="eps"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#epsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Dağılımı Donut */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 backdrop-blur flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Alert Severity Matrix</h3>
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
                      fill={SEVERITY_COLORS[entry.name] || "#3B82F6"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }}
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
      </div>

      {/* 3. Coğrafi Tehdit Haritası */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <span>Threat Geolocation Radar</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 font-mono animate-pulse">
                ATT&CK MAPPED
              </span>
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              Real-time attack origin visualization (Last 15 minutes anomaly clusters)
            </p>
          </div>
        </div>
        <ThreatMap alerts={alerts} />
      </div>

      {/* 4. Canlı Alert Timeline */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Alert Triage Queue</h3>
            <p className="text-xs text-gray-500 font-mono">
              Automated correlation alerts with MITRE ATT&CK technique IDs
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
                className="flex items-center justify-between p-3.5 rounded-lg border border-gray-800/80 bg-gray-950/60 hover:border-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase border"
                    style={{
                      borderColor: SEVERITY_COLORS[alert.severity] || "#3B82F6",
                      color: SEVERITY_COLORS[alert.severity] || "#3B82F6",
                      backgroundColor: `${SEVERITY_COLORS[alert.severity]}15`,
                    }}
                  >
                    {alert.severity}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-gray-100 flex items-center gap-2">
                      <span>{alert.rule?.name || "Security Anomaly"}</span>
                      {alert.rule?.attackTechnique && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                          {alert.rule.attackTechnique}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                      Source IP: <span className="text-gray-300">{alert.sourceIp}</span> • Events:{" "}
                      <span className="text-cyan-400">{alert.eventCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === "OPEN" ? (
                    <button
                      onClick={() => onOpenIncidentModal(alert)}
                      className="px-3 py-1 text-xs font-medium rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition flex items-center gap-1.5"
                    >
                      <span>Create Incident</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {alert.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
