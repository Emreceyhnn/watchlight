import React from "react";
import { Shield, Bell, Terminal, Play, Pause, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  eps: number;
  onTriggerSimulation: (type: string) => void;
  isSimulating: boolean;
  onOpenSidebar?: () => void;
}

export function Header({ eps, onTriggerSimulation, isSimulating, onOpenSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-12 border-b border-soc-border bg-soc-base/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-5 flex items-center justify-between text-xs">
      <div className="flex items-center gap-3">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="p-1.5 -ml-1 text-gray-400 hover:text-white rounded-lg hover:bg-soc-panel lg:hidden"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-gray-400">
          <span className="text-gray-400">Overview</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-200 font-medium">SOC Realtime Monitoring</span>
        </div>
        <div className="h-4 w-px bg-soc-border hidden sm:block" />
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-soc-success/10 border border-soc-success/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soc-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-soc-success" />
          </span>
          <span className="font-mono text-[11px] font-semibold text-soc-success tracking-tight">
            SSE LIVE &middot; {eps} eps
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Hızlı Saldırı Simülatörü Butonları */}
        <div className="hidden sm:flex items-center gap-1.5 bg-soc-card border border-soc-border p-1 rounded-lg">
          <button
            onClick={() => onTriggerSimulation("brute_force")}
            disabled={isSimulating}
            className="px-2.5 py-1 text-[11px] font-medium rounded text-soc-high hover:bg-soc-high/15 transition disabled:opacity-50"
          >
            ⚡ Brute Force
          </button>
          <button
            onClick={() => onTriggerSimulation("port_scan")}
            disabled={isSimulating}
            className="px-2.5 py-1 text-[11px] font-medium rounded text-soc-accent hover:bg-soc-accent/15 transition disabled:opacity-50"
          >
            🔍 Port Scan
          </button>
          <button
            onClick={() => onTriggerSimulation("exfiltration")}
            disabled={isSimulating}
            className="px-2.5 py-1 text-[11px] font-medium rounded text-soc-critical hover:bg-soc-critical/15 transition disabled:opacity-50"
          >
            🚨 Exfil
          </button>
        </div>

        <div className="h-4 w-px bg-soc-border hidden sm:block" />

        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-soc-accent/15 border border-soc-accent/40 flex items-center justify-center text-xs font-mono font-bold text-soc-accent">
            {initials}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-gray-200">{user?.name || user?.email}</div>
            <div className="text-[10px] text-gray-500 font-mono">{user?.role}</div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            aria-label="Sign Out"
            className="ml-1 rounded p-1.5 text-gray-400 hover:bg-soc-panel hover:text-soc-critical transition"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
