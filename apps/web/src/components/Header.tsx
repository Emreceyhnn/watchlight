import React from "react";
import { Shield, Bell, Terminal, Play, Pause, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  eps: number;
  onTriggerSimulation: (type: string) => void;
  isSimulating: boolean;
}

export function Header({ eps, onTriggerSimulation, isSimulating }: HeaderProps) {
  const { user, logout } = useAuth();
  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <header className="h-16 border-b border-gray-800 bg-[#0B0F14]/80 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold text-gray-300">
            CLUSTER: LIVE-SOC-01
          </span>
        </div>
        <div className="h-4 w-[1px] bg-gray-800" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">EPS:</span>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
            {eps} events/sec
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Hızlı Saldırı Simülatörü Butonları */}
        <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 p-1 rounded-lg">
          <button
            onClick={() => onTriggerSimulation("brute_force")}
            disabled={isSimulating}
            className="px-2.5 py-1 text-[11px] font-medium rounded text-amber-300 hover:bg-amber-500/20 transition disabled:opacity-50"
          >
            ⚡ Test Brute Force
          </button>
          <button
            onClick={() => onTriggerSimulation("port_scan")}
            disabled={isSimulating}
            className="px-2.5 py-1 text-[11px] font-medium rounded text-cyan-300 hover:bg-cyan-500/20 transition disabled:opacity-50"
          >
            🔍 Test Port Scan
          </button>
          <button
            onClick={() => onTriggerSimulation("exfiltration")}
            disabled={isSimulating}
            className="px-2.5 py-1 text-[11px] font-medium rounded text-red-300 hover:bg-red-500/20 transition disabled:opacity-50"
          >
            🚨 Test Exfil
          </button>
        </div>

        <div className="h-4 w-[1px] bg-gray-800" />

        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-400">
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-gray-200">{user?.name || user?.email}</div>
            <div className="text-[10px] text-gray-500 font-mono">{user?.role}</div>
          </div>
          <button
            onClick={() => logout()}
            title="Çıkış Yap"
            className="ml-1 rounded p-1.5 text-gray-500 hover:bg-gray-900 hover:text-red-400 transition"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
