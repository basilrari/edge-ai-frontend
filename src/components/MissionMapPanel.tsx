"use client";

import L from "leaflet";
import React, { useEffect, useRef, useState } from "react";
import type { DroneMission, DroneTelemetry } from "./types";
import "leaflet/dist/leaflet.css";
import { Map, Crosshair } from "lucide-react";

const INITIAL_ZOOM = 18;
const DEFAULT_CENTER: [number, number] = [23.558, 120.473];

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
  const userInteractedRef = useRef(false);
  const [mission, setMission] = useState<DroneMission | null>(null);

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

    const start =
      telemetry?.lat_deg != null && telemetry?.lon_deg != null
        ? ([telemetry.lat_deg, telemetry.lon_deg] as [number, number])
        : DEFAULT_CENTER;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      start,
      INITIAL_ZOOM
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    missionLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const markUser = () => {
      userInteractedRef.current = true;
    };
    map.on("zoomstart", markUser);
    map.on("dragstart", markUser);

    return () => {
      map.off("zoomstart", markUser);
      map.off("dragstart", markUser);
      map.remove();
      mapRef.current = null;
      missionLayerRef.current = null;
      droneMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init map once
  }, []);

  // First fix on drone: pan only (keep zoom). Never override after user pans/zooms.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || userInteractedRef.current) return;
    if (telemetry?.lat_deg == null || telemetry?.lon_deg == null) return;
    map.panTo([telemetry.lat_deg, telemetry.lon_deg], { animate: false });
  }, [telemetry?.lat_deg, telemetry?.lon_deg]);

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
    }

    if (telemetry?.lat_deg != null && telemetry?.lon_deg != null) {
      const latlng: L.LatLngExpression = [telemetry.lat_deg, telemetry.lon_deg];
      if (droneMarkerRef.current) {
        droneMarkerRef.current.setLatLng(latlng);
      } else {
        droneMarkerRef.current = L.circleMarker(latlng, {
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

  const centerOnDrone = () => {
    const map = mapRef.current;
    if (!map || telemetry?.lat_deg == null || telemetry?.lon_deg == null) return;
    map.setView([telemetry.lat_deg, telemetry.lon_deg], map.getZoom(), { animate: true });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
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
        <button
          type="button"
          className="outline ml-auto flex items-center gap-1 text-[11px]"
          onClick={centerOnDrone}
          disabled={telemetry?.lat_deg == null}
        >
          <Crosshair className="h-3 w-3" />
          Center drone
        </button>
      </div>
      <div
        ref={containerRef}
        className="h-56 w-full overflow-hidden rounded-xl border border-slate-700/70 sm:h-64"
      />
    </div>
  );
}
