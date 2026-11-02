import React from "react";
import { Shield, Radio, Activity, AlertTriangle, FileText, Globe, Sliders, Play } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeAlertCount: number;
}

export function Sidebar({ currentTab, setCurrentTab, activeAlertCount }: SidebarProps) {
  const { user } = useAuth();
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "stream", label: "Live Alerts", icon: Radio, badge: activeAlertCount > 0 ? activeAlertCount : null },
    { id: "incidents", label: "Incidents", icon: FileText },
    { id: "rules", label: "Detection Rules", icon: Sliders },
    { id: "threatmap", label: "Threat Map", icon: Globe },
    { id: "simulator", label: "Simulator", icon: Play },
  ];

  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-60 border-r border-soc-border-soft bg-soc-base flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-soc-border-soft">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-soc-accent/10 border border-soc-accent/30">
            <Shield className="h-5 w-5 text-soc-accent" fill="currentColor" fillOpacity={0.15} />
          </div>
          <div className="min-w-0">
            <div className="font-heading font-bold tracking-wide text-sm text-white truncate">
              WATCHLIGHT
            </div>
            <div className="text-[10px] text-gray-500 font-mono tracking-wide uppercase truncate">
              Mini-SIEM Analyst Ops
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-soc-accent/10 text-soc-accent border border-soc-accent/25"
                    : "text-gray-400 hover:text-gray-100 hover:bg-soc-elevated border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-[17px] w-[17px] ${isActive ? "text-soc-accent" : "text-gray-500"}`} strokeWidth={1.75} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-soc-critical/15 text-soc-critical border border-soc-critical/30">
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

      {/* Footer: analyst profile */}
      <div className="p-3 border-t border-soc-border-soft">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-soc-elevated transition-colors cursor-pointer">
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-full bg-soc-accent/20 border border-soc-accent/40 flex items-center justify-center text-[11px] font-bold text-soc-accent">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-soc-success border-2 border-soc-base" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-gray-200 truncate">
              {user?.name || user?.email}
            </div>
            <div className="text-[10px] text-gray-500 font-mono truncate">
              {user?.role || "Tier 2 SOC Analyst"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
