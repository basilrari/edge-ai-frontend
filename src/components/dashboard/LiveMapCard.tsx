"use client";

import L from "leaflet";
import React, { useEffect, useRef, useState } from "react";
import {
  Circle,
  Minus,
  MousePointer2,
  PenLine,
  Plus,
  Ruler,
  Shapes,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { DashboardCard } from "./DashboardCard";
import { MOCK_MAP_WEATHER } from "../../lib/mockData";
import type { Telemetry, Waypoint } from "../../types/drone";

interface Props {
  waypoints: Waypoint[];
  telemetry: Telemetry;
}

const MAP_TOOLS = [
  { icon: MousePointer2, label: "Select" },
  { icon: PenLine, label: "Path" },
  { icon: Shapes, label: "Polygon" },
  { icon: Circle, label: "Point" },
  { icon: Ruler, label: "Measure" },
  { icon: Shapes, label: "Layers" },
] as const;

export function LiveMapCard({ waypoints, telemetry }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const droneRef = useRef<L.CircleMarker | null>(null);
  const [view3d, setView3d] = useState(false);
  const [activeTool, setActiveTool] = useState(0);

  const center: [number, number] =
    telemetry.lat != null && telemetry.lng != null
      ? [telemetry.lat, telemetry.lng]
      : [waypoints[0]?.lat ?? 37.774, waypoints[0]?.lng ?? -122.419];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, 15);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    ).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      droneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (waypoints.length > 1) {
      const latlngs = waypoints.map((w) => [w.lat, w.lng] as [number, number]);
      L.polyline(latlngs, {
        color: "#3B82F6",
        weight: 3,
        opacity: 0.95,
        dashArray: view3d ? "6 4" : undefined,
      }).addTo(layer);

      waypoints.forEach((w) => {
        L.circleMarker([w.lat, w.lng], {
          radius: 7,
          color: "#93C5FD",
          fillColor: "#3B82F6",
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(layer);
      });
    }

    if (telemetry.lat != null && telemetry.lng != null) {
      const pos: [number, number] = [telemetry.lat, telemetry.lng];
      if (droneRef.current) {
        droneRef.current.setLatLng(pos);
      } else {
        droneRef.current = L.circleMarker(pos, {
          radius: 12,
          color: "#4ADE80",
          fillColor: "#4ADE80",
          fillOpacity: 1,
          weight: 3,
        }).addTo(map);
      }
    }
  }, [waypoints, telemetry.lat, telemetry.lng, view3d]);

  const zoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(map.getZoom() + delta);
  };

  const w = MOCK_MAP_WEATHER;

  return (
    <DashboardCard
      title="Live Map"
      className="h-full min-h-[320px]"
      bodyClassName="relative p-0"
    >
      <div className="relative h-full min-h-[300px] w-full">
        <div ref={containerRef} className="absolute inset-0 z-0" />

        {/* Left map tools */}
        <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1">
          {MAP_TOOLS.map(({ icon: Icon, label }, i) => (
            <button
              key={label}
              type="button"
              title={label}
              onClick={() => setActiveTool(i)}
              className={`flex h-9 w-9 items-center justify-center rounded-md border backdrop-blur-sm ${
                activeTool === i
                  ? "border-dash-accent/50 bg-dash-accent/10 text-dash-accent"
                  : "border-dash-border bg-dash-panel/95 text-dash-muted hover:text-dash-text"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* Weather / GPS pill — top right */}
        <div className="pointer-events-none absolute right-14 top-3 z-10 flex items-center gap-2 rounded-full border border-slate-600/50 bg-slate-950/88 px-3 py-1.5 text-[11px] text-slate-200 backdrop-blur-sm">
          <span>{w.temperatureC}°C</span>
          <span className="text-slate-600">|</span>
          <span>
            {w.windSpeedKmh} km/h {w.windDirection}
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {w.gpsQuality}
          </span>
        </div>

        {/* Right nav controls */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
          <div className="flex h-9 w-9 flex-col items-center justify-center rounded-md border border-slate-600/50 bg-slate-950/88 text-[9px] font-bold text-slate-300">
            N
          </div>
          <button
            type="button"
            className={`flex h-8 w-9 items-center justify-center rounded-md border text-[10px] font-semibold ${
              view3d
                ? "border-emerald-500/40 bg-emerald-950/80 text-emerald-300"
                : "border-slate-600/50 bg-slate-950/88 text-slate-400"
            }`}
            onClick={() => setView3d((v) => !v)}
          >
            3D
          </button>
          <button
            type="button"
            className="flex h-8 w-9 items-center justify-center rounded-md border border-slate-600/50 bg-slate-950/88 text-slate-300 hover:bg-slate-800"
            onClick={() => zoom(1)}
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-9 items-center justify-center rounded-md border border-slate-600/50 bg-slate-950/88 text-slate-300 hover:bg-slate-800"
            onClick={() => zoom(-1)}
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded border border-slate-600/40 bg-slate-950/75 px-2 py-0.5 font-mono text-[10px] text-slate-400">
          100 m
        </div>
      </div>
    </DashboardCard>
  );
}
