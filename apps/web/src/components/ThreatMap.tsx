"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface ThreatMapProps {
  alerts: any[];
  onOpenIncidentModal?: (alert: any) => void;
  fill?: boolean;
}

const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  TR: [39.9334, 32.8597],
  US: [37.0902, -95.7129],
  DE: [51.1657, 10.4515],
  RU: [61.524, 105.3188],
  CN: [35.8617, 104.1954],
  GB: [55.3781, -3.436],
  NL: [52.1326, 5.2913],
  FR: [46.2276, 2.2137],
  JP: [36.2048, 138.2529],
  BR: [-14.235, -51.9253],
};

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY;

const TILE_URL = CARTO_API_KEY
  ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTRIBUTION = CARTO_API_KEY
  ? '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function ThreatMap({ alerts, onOpenIncidentModal, fill }: ThreatMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const countryOccurrence: Record<string, number> = {};
  const points = alerts.slice(0, 15).map((a, i) => {
    const country = a.geoCountry || "RU";
    const base = COUNTRY_COORDINATES[country] || [50 + (i % 5), 20 + (i % 10)];
    const occurrence = countryOccurrence[country] || 0;
    countryOccurrence[country] = occurrence + 1;
    const angle = occurrence * 0.9;
    const radius = occurrence === 0 ? 0 : 1.2 + occurrence * 0.4;
    const coords: [number, number] = [
      base[0] + Math.sin(angle) * radius,
      base[1] + Math.cos(angle) * radius,
    ];
    return {
      id: a.id || i,
      coords,
      ip: a.sourceIp,
      severity: a.severity,
      technique: a.rule?.attackTechnique || "T1110",
      ruleName: a.rule?.name || "Security Anomaly",
      alert: a,
    };
  });

  return (
    <div
      className={
        fill
          ? "h-full w-full relative z-10"
          : "h-80 w-full rounded-lg overflow-hidden border border-gray-800 relative z-10"
      }
      role="region"
      aria-label="Threat Geolocation Map"
    >
      <div className="sr-only">
        <h4>Geospatial Threat Summary</h4>
        <ul>
          {points.map((pt) => (
            <li key={pt.id}>
              {pt.severity} severity anomaly {pt.technique} from IP {pt.ip} ({pt.ruleName})
            </li>
          ))}
        </ul>
      </div>
      <MapContainer
        center={[30, 10]}
        zoom={2}
        scrollWheelZoom={false}
        className="h-full w-full bg-[#0B0F14]"
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />

        {points.map((pt) => {
          const color =
            pt.severity === "CRITICAL"
              ? "#EF4444"
              : pt.severity === "HIGH"
              ? "#F59E0B"
              : "#22D3EE";

          return (
            <CircleMarker
              key={pt.id}
              center={pt.coords}
              radius={8}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.6,
                weight: 2,
              }}
            >
              <Popup className="soc-popup">
                <div className="p-1 font-mono text-xs text-gray-900 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {pt.severity}
                    </span>
                    <span className="font-bold text-gray-900">MITRE {pt.technique}</span>
                  </div>
                  <div>IP: {pt.ip}</div>
                  <div className="text-[10px] text-gray-700">{pt.ruleName}</div>
                  {onOpenIncidentModal && (
                    <button
                      onClick={() => onOpenIncidentModal(pt.alert)}
                      className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-gray-700"
                    >
                      Triage Alert
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
