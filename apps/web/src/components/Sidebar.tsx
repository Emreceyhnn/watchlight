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
  const [workerOnline, setWorkerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWorker = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const json = await res.json();
          setWorkerOnline(!!json.worker?.online);
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
      label: "Alerts",
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount : null,
    },
    { id: "threatmap", label: "Threat Map", icon: Globe },
    { id: "incidents", label: "Incidents", icon: FileText },
    { id: "rules", label: "SIEM Rules", icon: Sliders },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-gray-800 bg-[#070A0E] flex flex-col justify-between shrink-0 h-screen transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo & Mobile Close */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Shield className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <div className="font-bold text-white tracking-wider flex items-center gap-1.5 text-sm">
                  WATCH<span className="text-cyan-400">LIGHT</span>
                </div>
                <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                  Mini-SIEM / SOC
                </div>
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
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                      : "text-gray-300 hover:text-gray-100 hover:bg-gray-900/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-gray-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer SOC Status */}
        <div className="p-4 border-t border-gray-800/80 bg-gray-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-400">Worker Status</span>
            {workerOnline === true ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            ) : workerOnline === false ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                OFFLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                CHECKING
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Active Pipeline</span>
            <span className="text-[11px] font-mono text-cyan-400">Redis Pub/Sub</span>
          </div>
        </div>
      </aside>
    </>
  );
}
