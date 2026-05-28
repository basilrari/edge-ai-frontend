"use client";

import L from "leaflet";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DroneMission, DroneTelemetry } from "./types";
import "leaflet/dist/leaflet.css";
import { Map } from "lucide-react";

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `map-${Date.now()}`;
}

interface Props {
  gatewayUrl: string;
  telemetry: DroneTelemetry | null;
}

export function MissionMapPanel({ gatewayUrl, telemetry }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const droneMarkerRef = useRef<L.CircleMarker | null>(null);
  const missionLayerRef = useRef<L.LayerGroup | null>(null);
  const [mission, setMission] = useState<DroneMission | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (telemetry?.lat_deg != null && telemetry?.lon_deg != null) {
      return [telemetry.lat_deg, telemetry.lon_deg];
    }
    return [23.558, 120.473];
  }, [telemetry?.lat_deg, telemetry?.lon_deg]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`${gatewayUrl}/drone/mission`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) return;
        const data = (await res.json()) as DroneMission;
        if (active) setMission(data);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [gatewayUrl]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView(center, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    missionLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      missionLayerRef.current = null;
      droneMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = missionLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const wps = mission?.waypoints ?? [];
    if (wps.length > 0) {
      const latlngs: L.LatLngExpression[] = wps.map((w) => [w.lat_deg, w.lon_deg]);
      L.polyline(latlngs, { color: "#22d3ee", weight: 3, opacity: 0.85 }).addTo(layer);
      wps.forEach((w) => {
        const isCurrent = mission?.current_seq === w.seq;
        L.circleMarker([w.lat_deg, w.lon_deg], {
          radius: isCurrent ? 8 : 5,
          color: isCurrent ? "#fbbf24" : "#67e8f9",
          fillColor: isCurrent ? "#fbbf24" : "#0891b2",
          fillOpacity: 0.9,
          weight: 2,
        })
          .bindTooltip(`WP ${w.seq} · ${w.alt_m.toFixed(0)} m`)
          .addTo(layer);
      });
      if (latlngs.length > 1) {
        map.fitBounds(L.latLngBounds(latlngs), { padding: [24, 24], maxZoom: 17 });
      }
    }

    if (telemetry?.lat_deg != null && telemetry?.lon_deg != null) {
      if (droneMarkerRef.current) {
        droneMarkerRef.current.setLatLng([telemetry.lat_deg, telemetry.lon_deg]);
      } else {
        droneMarkerRef.current = L.circleMarker([telemetry.lat_deg, telemetry.lon_deg], {
          radius: 10,
          color: "#34d399",
          fillColor: "#10b981",
          fillOpacity: 0.95,
          weight: 2,
        })
          .bindTooltip("Drone")
          .addTo(map);
      }
    }
  }, [mission, telemetry?.lat_deg, telemetry?.lon_deg]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Map className="h-4 w-4 text-cyan-400" />
        <h2 className="text-sm font-semibold">Mission map</h2>
        {mission?.waypoints?.length ? (
          <span className="text-[11px] text-slate-500">
            {mission.waypoints.length} waypoint(s)
            {mission.current_seq != null ? ` · current ${mission.current_seq}` : ""}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">No mission on link yet</span>
        )}
      </div>
      <div
        ref={containerRef}
        className="h-56 w-full overflow-hidden rounded-xl border border-slate-700/70 sm:h-64"
      />
    </div>
  );
}
