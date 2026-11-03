"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardView } from "@/components/DashboardView";
import { IncidentModal } from "@/components/IncidentModal";
import { LoginForm } from "@/components/LoginForm";
import { AlertsView } from "@/components/AlertsView";
import { FullThreatMapView } from "@/components/FullThreatMapView";
import { RulesView } from "@/components/RulesView";
import { useAuth } from "@/lib/auth-context";
import { Radio, AlertTriangle, FileText, Sliders, Globe } from "lucide-react";

export default function SOCPortal() {
  const { user, accessToken, isLoading, authFetch } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-gray-300 font-mono text-sm">
        Initializing Watchlight SOC Engine...
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Üst Çubuk */}
        <Header
          eps={stats?.summary?.eps || 420}
          onTriggerSimulation={handleTriggerSimulation}
          isSimulating={isSimulating}
          onOpenSidebar={() => setIsSidebarOpen(true)}
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
                <span>Live Event Stream</span>
              </h3>
              <div
                className="font-mono text-xs space-y-2"
                aria-live="polite"
                aria-atomic="false"
                role="status"
              >
                {liveEvents.length === 0 ? (
                  <div className="text-gray-400 py-6 text-center">
                    📡 Listening on &apos;events:stream&apos; Pub/Sub...
                  </div>
                ) : (
                  liveEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-gray-950/70 border border-gray-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">{evt.type}</span>
                        <span className="text-gray-300">src: {evt.sourceIp}</span>
                        {evt.username && <span className="text-amber-400">user: {evt.username}</span>}
                      </div>
                      <span className="text-gray-400 text-[10px] font-semibold">{evt.geoCountry || "TR"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentTab === "alerts" && (
            <AlertsView
              alerts={alerts}
              onOpenIncidentModal={(alert) => setSelectedAlertForIncident(alert)}
            />
          )}

          {currentTab === "threatmap" && (
            <FullThreatMapView alerts={alerts} />
          )}

          {currentTab === "incidents" && (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <span>SOC Incident Management & Resolution Lifecycle</span>
                </h3>
                <span className="text-xs font-mono text-gray-400">
                  Total Active Incidents: {incidents.filter((i) => i.status !== "CLOSED").length}
                </span>
              </div>
              <div className="space-y-3">
                {incidents.length === 0 ? (
                  <div className="text-gray-400 py-6 text-center text-xs font-mono">
                    No escalated incidents. All alerts mitigated.
                  </div>
                ) : (
                  incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-4 rounded-lg border border-gray-800 bg-gray-950/70 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-gray-100">{inc.title}</div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {inc.priority} • {inc.status}
                          </span>
                          {/* Incident Lifecycle Status Actions */}
                          {inc.status === "OPEN" && (
                            <button
                              onClick={async () => {
                                await authFetch(`/api/incidents/${inc.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "IN_PROGRESS", note: "Analyst started active investigation." }),
                                });
                                fetchData();
                              }}
                              className="px-2 py-0.5 text-[10px] font-mono rounded bg-blue-900/40 text-blue-300 border border-blue-700/50 hover:bg-blue-800/50"
                            >
                              Start Investigation
                            </button>
                          )}
                          {inc.status === "IN_PROGRESS" && (
                            <button
                              onClick={async () => {
                                await authFetch(`/api/incidents/${inc.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "MITIGATED", note: "Threat mitigated via firewall isolation." }),
                                });
                                fetchData();
                              }}
                              className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800/50"
                            >
                              Mark Mitigated
                            </button>
                          )}
                          {inc.status === "MITIGATED" && (
                            <button
                              onClick={async () => {
                                await authFetch(`/api/incidents/${inc.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "CLOSED", note: "Post-incident audit completed. Closing incident." }),
                                });
                                fetchData();
                              }}
                              className="px-2 py-0.5 text-[10px] font-mono rounded bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                            >
                              Close Incident
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-300">{inc.summary}</p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-1 border-t border-gray-850">
                        <span>Assignee: <strong className="text-gray-200">{inc.assignee}</strong></span>
                        <span>Created: {new Date(inc.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentTab === "rules" && (
            <RulesView authFetch={authFetch} />
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
