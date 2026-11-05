"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Globe, ShieldAlert } from "lucide-react";

const ThreatMap = dynamic(() => import("@/components/ThreatMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] rounded-xl border border-gray-800 bg-gray-900/40 flex items-center justify-center text-gray-500 font-mono text-xs">
      Loading Fullscreen Threat Map Engine...
    </div>
  ),
});

interface FullThreatMapViewProps {
  alerts: any[];
  onOpenIncidentModal?: (alert: any) => void;
}

export function FullThreatMapView({ alerts, onOpenIncidentModal }: FullThreatMapViewProps) {
  const geoAlerts = alerts.filter((a) => a.geoCountry || a.sourceIp);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 bg-gray-900/50 px-5 py-3">
        <div>
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-400" />
            <span>Global Threat Geolocation Radar</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Geospatial tracking of inbound malicious traffic, botnets, and anomalies &middot; click a marker to triage
          </p>
        </div>
        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-500/20 self-start sm:self-auto">
          Active Threat Vectors: {alerts.length}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ThreatMap alerts={geoAlerts} onOpenIncidentModal={onOpenIncidentModal} fill />
      </div>
    </div>
  );
}

