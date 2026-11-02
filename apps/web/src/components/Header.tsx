"use client";

import React, { useEffect, useState } from "react";
import { Search, LogOut, Zap, Radar, Radio } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  eps: number;
  onTriggerSimulation: (type: string) => void;
  isSimulating: boolean;
}

export function Header({ eps, onTriggerSimulation, isSimulating }: HeaderProps) {
  const { logout } = useAuth();
  const [utc, setUtc] = useState("");

  useEffect(() => {
    const tick = () => setUtc(new Date().toUTCString().slice(17, 25) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-16 border-b border-soc-border-soft bg-soc-base/85 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div>
          <div className="font-heading text-sm font-semibold text-white leading-tight">Overview</div>
          <div className="text-[11px] text-gray-500 leading-tight">SOC Realtime Monitoring</div>
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-lg border border-soc-border bg-soc-card px-3 py-1.5 text-xs text-gray-500 w-64">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Search raw logs, IP, hash, CVE…</span>
          <kbd className="ml-auto shrink-0 rounded border border-soc-border bg-soc-elevated px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Attack simulator quick actions */}
        <div className="hidden lg:flex items-center gap-1 rounded-lg border border-soc-border bg-soc-card p-1">
          <button
            onClick={() => onTriggerSimulation("brute_force")}
            disabled={isSimulating}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md text-soc-high hover:bg-soc-high/10 transition disabled:opacity-40"
          >
            <Zap className="h-3 w-3" /> Brute Force
          </button>
          <button
            onClick={() => onTriggerSimulation("port_scan")}
            disabled={isSimulating}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md text-soc-accent hover:bg-soc-accent/10 transition disabled:opacity-40"
          >
            <Radar className="h-3 w-3" /> Port Scan
          </button>
          <button
            onClick={() => onTriggerSimulation("exfiltration")}
            disabled={isSimulating}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md text-soc-critical hover:bg-soc-critical/10 transition disabled:opacity-40"
          >
            <Radio className="h-3 w-3" /> Exfil
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-soc-success/30 bg-soc-success/10 px-3 py-1.5 text-[11px] font-mono font-semibold text-soc-success">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soc-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-soc-success" />
          </span>
          SSE LIVE ({(eps / 1000).toFixed(1)}k eps)
        </div>

        <div className="hidden xl:block text-[11px] font-mono text-gray-500 tabular-nums">{utc}</div>

        <button
          onClick={() => logout()}
          title="Çıkış Yap"
          className="rounded-lg border border-soc-border p-2 text-gray-500 hover:bg-soc-elevated hover:text-soc-critical transition"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
