import React, { useEffect, useState } from "react";
import { Shield, Radio, Activity, AlertTriangle, FileText, Globe, Sliders, X } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeAlertCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  currentTab,
  setCurrentTab,
  activeAlertCount,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const [workerOnline, setWorkerOnline] = useState<boolean | null>(() => {
    // İlk render'da son bilinen durumu localStorage'dan oku; böylece sayfa
    // geçişlerinde kısa süreli "CHECKING" titremesi oluşmaz.
    try {
      const cached = localStorage.getItem("watchlight:workerOnline");
      return cached === null ? null : cached === "true";
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const checkWorker = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const json = await res.json();
          const online = !!json.worker?.online;
          setWorkerOnline(online);
          try {
            localStorage.setItem("watchlight:workerOnline", String(online));
          } catch {
            // localStorage kullanılamıyorsa sessizce yoksay
          }
        } else {
          setWorkerOnline(false);
        }
      } catch {
        setWorkerOnline(false);
      }
    };

    checkWorker();
    const interval = setInterval(checkWorker, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "stream", label: "Live Events", icon: Radio },
    {
      id: "alerts",
      label: "Live Alerts",
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount : null,
    },
    { id: "rules", label: "Detection Rules", icon: Sliders },
    { id: "threatmap", label: "Threat Map", icon: Globe },
    { id: "incidents", label: "Incidents", icon: FileText },
  ];

  const handleTabSelect = (tab: string) => {
    setCurrentTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 border-r border-soc-border bg-soc-base flex flex-col justify-between shrink-0 h-screen p-3 select-none transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="space-y-4">
          {/* Logo & Mobile Close */}
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-soc-accent/10 border border-soc-accent/30 text-soc-accent shadow-[0_0_12px_rgba(91,140,255,0.25)]">
                <Shield className="h-[19px] w-[19px]" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-heading font-bold text-base tracking-wider uppercase text-white">
                  Watchlight
                </span>
                <span className="text-[10px] text-gray-400 font-mono tracking-tight mt-1">
                  Mini-SIEM Analyst Ops
                </span>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded text-gray-300 hover:text-white lg:hidden"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Nav Links */}
          <nav className="space-y-0.5 font-heading text-sm tracking-tight pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-r-lg text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-accent ${
                    isActive
                      ? "bg-soc-panel text-soc-accent border-l-2 border-soc-accent font-medium"
                      : "text-gray-400 hover:text-gray-100 hover:bg-soc-panel/60 rounded-lg"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-soc-accent" : "text-gray-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-soc-critical/15 text-soc-critical border border-soc-critical/40 leading-none">
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-soc-accent" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer SOC Status */}
        <div className="pt-3 border-t border-soc-border/80">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] text-gray-400 font-mono">Worker Status</span>
            {workerOnline === true ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-soc-success">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soc-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-soc-success" />
                </span>
                ONLINE
              </span>
            ) : workerOnline === false ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-soc-critical">
                <span className="h-1.5 w-1.5 rounded-full bg-soc-critical" />
                OFFLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-soc-high">
                <span className="h-1.5 w-1.5 rounded-full bg-soc-high animate-pulse" />
                CHECKING
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-soc-panel/40 border border-soc-border/50">
            <div className="h-8 w-8 rounded bg-gradient-to-tr from-soc-accent to-indigo-500 flex items-center justify-center text-xs font-heading font-semibold text-white shrink-0">
              SO
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-100 truncate">SOC Analyst</div>
              <div className="text-[10px] text-gray-400 font-mono truncate">Redis Pub/Sub</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
