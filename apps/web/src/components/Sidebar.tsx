import React from "react";
import Link from "next/link";
import { Shield, Radio, Activity, AlertTriangle, FileText, Globe, Sliders } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeAlertCount: number;
}

export function Sidebar({ currentTab, setCurrentTab, activeAlertCount }: SidebarProps) {
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

  return (
    <aside className="w-64 border-r border-gray-800 bg-[#070A0E] flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wider flex items-center gap-1.5 text-sm">
              WATCH<span className="text-cyan-400">LIGHT</span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              Mini-SIEM / SOC
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-gray-500"}`} />
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
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            ONLINE
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Active Pipeline</span>
          <span className="text-[11px] font-mono text-cyan-400">Redis Pub/Sub</span>
        </div>
      </div>
    </aside>
  );
}
