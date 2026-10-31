"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardView } from "@/components/DashboardView";
import { IncidentModal } from "@/components/IncidentModal";
import { LoginForm } from "@/components/LoginForm";
import { useAuth } from "@/lib/auth-context";
import { Radio, AlertTriangle, FileText, Sliders, Globe } from "lucide-react";

export default function SOCPortal() {
  const { user, accessToken, isLoading, authFetch } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  if (!user || !accessToken) {
    return <LoginForm />;
  }

  return <SOCDashboard accessToken={accessToken} authFetch={authFetch} />;
}

function SOCDashboard({
  accessToken,
  authFetch,
}: {
  accessToken: string;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
}) {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedAlertForIncident, setSelectedAlertForIncident] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Verileri çek
  const fetchData = async () => {
    try {
      const [resStats, resAlerts, resIncidents] = await Promise.all([
        authFetch("/api/stats/summary"),
        authFetch("/api/alerts"),
        authFetch("/api/incidents"),
      ]);

      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data.data);
      }
      if (resAlerts.ok) {
        const data = await resAlerts.json();
        setAlerts(data.data || []);
      }
      if (resIncidents.ok) {
        const data = await resIncidents.json();
        setIncidents(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch SOC data:", err);
    }
  };

  useEffect(() => {
    fetchData();

    // Server-Sent Events (SSE) Canlı Bağlantısı (Faz 13)
    const eventSource = new EventSource(`/api/stream?token=${encodeURIComponent(accessToken)}`);

    eventSource.addEventListener("event", (e: any) => {
      try {
        const parsed = JSON.parse(e.data);
        setLiveEvents((prev) => [parsed, ...prev.slice(0, 49)]);
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    });

    eventSource.addEventListener("alert", (e: any) => {
      try {
        const parsed = JSON.parse(e.data);
        setAlerts((prev) => [parsed, ...prev]);
        fetchData(); // İstatistikleri güncelle
      } catch (err) {
        console.error("SSE alert parse error:", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [accessToken]);

  // Simülatör tetikleme fonksiyonu
  const handleTriggerSimulation = async (scenario: string) => {
    setIsSimulating(true);
    try {
      // Simülatör endpoint'ine hızlı event gönderimi
      const events: any[] = [];
      const testIp = `185.220.101.${Math.floor(Math.random() * 200 + 10)}`;

      if (scenario === "brute_force") {
        for (let i = 0; i < 7; i++) {
          events.push({
            type: "AUTH_FAILED",
            sourceIp: testIp,
            username: "root",
            geoCountry: "RU",
            timestamp: new Date().toISOString(),
          });
        }
      } else if (scenario === "port_scan") {
        for (let i = 0; i < 25; i++) {
          events.push({
            type: "NETWORK_SCAN",
            sourceIp: testIp,
            destPort: 20 + i,
            geoCountry: "CN",
            timestamp: new Date().toISOString(),
          });
        }
      } else if (scenario === "exfiltration") {
        events.push({
          type: "DATA_TRANSFER",
          sourceIp: testIp,
          payload: { bytes: 150 * 1024 * 1024 },
          geoCountry: "US",
          timestamp: new Date().toISOString(),
        });
      }

      await authFetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });

      // Verileri anında tazele
      setTimeout(fetchData, 600);
    } catch (err) {
      console.error("Simulation trigger failed:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F14] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Yan Menü */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeAlertCount={alerts.filter((a) => a.status === "OPEN").length}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Üst Çubuk */}
        <Header
          eps={stats?.summary?.eps || 420}
          onTriggerSimulation={handleTriggerSimulation}
          isSimulating={isSimulating}
        />

        {/* Ana İçerik */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {currentTab === "dashboard" && (
            <DashboardView
              stats={stats}
              liveEvents={liveEvents}
              alerts={alerts}
              onOpenIncidentModal={(alert) => setSelectedAlertForIncident(alert)}
            />
          )}

          {currentTab === "stream" && (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span>Live Event Stream (Virtualized Queue)</span>
              </h3>
              <div className="font-mono text-xs space-y-2">
                {liveEvents.length === 0 ? (
                  <div className="text-gray-500 py-6 text-center">
                    📡 Listening on 'events:stream' Pub/Sub...
                  </div>
                ) : (
                  liveEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-gray-950/70 border border-gray-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">{evt.type}</span>
                        <span className="text-gray-400">src: {evt.sourceIp}</span>
                        {evt.username && <span className="text-amber-400">user: {evt.username}</span>}
                      </div>
                      <span className="text-gray-500 text-[10px]">{evt.geoCountry || "TR"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentTab === "incidents" && (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>SOC Incident Management</span>
              </h3>
              <div className="space-y-3">
                {incidents.length === 0 ? (
                  <div className="text-gray-500 py-6 text-center text-xs font-mono">
                    No escalated incidents. All alerts mitigated.
                  </div>
                ) : (
                  incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-4 rounded-lg border border-gray-800 bg-gray-950/70 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm text-gray-100">{inc.title}</div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {inc.priority} • {inc.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{inc.summary}</p>
                      <div className="text-[11px] font-mono text-gray-500">
                        Assignee: {inc.assignee}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Incident Modal */}
      {selectedAlertForIncident && (
        <IncidentModal
          alert={selectedAlertForIncident}
          onClose={() => setSelectedAlertForIncident(null)}
          onIncidentCreated={fetchData}
          authFetch={authFetch}
        />
      )}
    </div>
  );
}
