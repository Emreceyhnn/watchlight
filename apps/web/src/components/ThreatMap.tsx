"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface ThreatMapProps {
  alerts: any[];
}

// Ülke koordinat eşlemeleri (Demo ve küresel saldırı kaynakları için)
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

export default function ThreatMap({ alerts }: ThreatMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Haritada gösterilecek anomali noktaları
  const points = alerts.slice(0, 15).map((a, i) => {
    // Kaynak ülke veya varsayılan koordinat
    const country = a.geoCountry || "RU";
    const coords = COUNTRY_COORDINATES[country] || [50 + (i % 5), 20 + (i % 10)];
    return {
      id: a.id || i,
      coords,
      ip: a.sourceIp,
      severity: a.severity,
      technique: a.rule?.attackTechnique || "T1110",
      ruleName: a.rule?.name || "Security Anomaly",
    };
  });

  return (
    <div className="h-80 w-full rounded-lg overflow-hidden border border-gray-800 relative z-10">
      <MapContainer
        center={[30, 10]}
        zoom={2}
        scrollWheelZoom={false}
        className="h-full w-full bg-[#0B0F14]"
      >
        {/* CartoDB DarkMatter Tiles (SOC karanlık tema için optimize) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

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
                <div className="p-1 font-mono text-xs text-gray-900">
                  <div className="font-bold text-red-600">{pt.technique}</div>
                  <div>IP: {pt.ip}</div>
                  <div className="text-[10px] text-gray-700">{pt.ruleName}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
