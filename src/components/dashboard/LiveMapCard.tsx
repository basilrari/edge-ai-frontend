"use client";

import L from "leaflet";
import React, { useCallback, useEffect, useRef } from "react";
import { Crosshair, Minus, Plus } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { DashboardCard } from "./DashboardCard";
import type { Telemetry, Waypoint } from "../../types/drone";
import { fmtLinkKind } from "../../lib/format";

interface Props {
  waypoints: Waypoint[];
  telemetry: Telemetry;
}

const DEFAULT_CENTER: [number, number] = [23.558, 120.473];
const MAP_HEIGHT_PX = 320;
const INITIAL_ZOOM = 18;

/** Dark basemap — free, no API key; sharper high-zoom labels than Esri imagery. */
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export function LiveMapCard({ waypoints, telemetry }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const droneRef = useRef<L.CircleMarker | null>(null);
  const userInteractedRef = useRef(false);

  const center: [number, number] =
    telemetry.lat != null && telemetry.lng != null
      ? [telemetry.lat, telemetry.lng]
      : waypoints[0]
        ? [waypoints[0].lat, waypoints[0].lng]
        : DEFAULT_CENTER;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      zoomSnap: 0,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 50,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 2800,
    }).setView(center, waypoints.length ? INITIAL_ZOOM : INITIAL_ZOOM - 2);

    L.tileLayer(TILE_URL, {
      subdomains: "abcd",
      maxZoom: 20,
      detectRetina: true,
    }).addTo(map);

    L.control
      .scale({ imperial: false, maxWidth: 120 })
      .addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const markUser = () => {
      userInteractedRef.current = true;
    };
    map.on("zoomstart", markUser);
    map.on("dragstart", markUser);

    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.off("zoomstart", markUser);
      map.off("dragstart", markUser);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      droneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || userInteractedRef.current) return;
    if (telemetry.lat == null || telemetry.lng == null) return;
    map.panTo([telemetry.lat, telemetry.lng], { animate: false });
  }, [telemetry.lat, telemetry.lng]);

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
  }, [waypoints, telemetry.lat, telemetry.lng]);

  const smoothZoom = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    userInteractedRef.current = true;
    const next = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), map.getZoom() + delta));
    map.flyTo(map.getCenter(), next, { duration: 0.35, easeLinearity: 0.25 });
  }, []);

  const centerOnDrone = useCallback(() => {
    const map = mapRef.current;
    if (!map || telemetry.lat == null || telemetry.lng == null) return;
    userInteractedRef.current = true;
    map.flyTo([telemetry.lat, telemetry.lng], map.getZoom(), {
      duration: 0.45,
      easeLinearity: 0.25,
    });
  }, [telemetry.lat, telemetry.lng]);

  const gpsLabel = telemetry.hasFix ? "GPS fix" : "Waiting for GPS";
  const linkLabel = fmtLinkKind(telemetry.link?.kind);

  return (
    <DashboardCard title="Live Map" bodyClassName="relative overflow-hidden p-0">
      <div
        className="relative isolate w-full"
        style={{ height: MAP_HEIGHT_PX }}
      >
        <div ref={containerRef} className="absolute inset-0 z-0" />

        <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-full border border-dash-border bg-dash-panel/95 px-3 py-1.5 text-[11px] text-dash-text backdrop-blur-sm">
          <span
            className={
              telemetry.hasFix ? "text-dash-accent" : "text-dash-muted"
            }
          >
            {gpsLabel}
          </span>
          {linkLabel ? (
            <>
              <span className="text-dash-border"> · </span>
              <span className="text-dash-muted">{linkLabel}</span>
            </>
          ) : null}
        </div>

        <div className="absolute right-3 top-3 z-[400] flex flex-col gap-1">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-dash-border bg-dash-panel/95 text-dash-muted hover:text-dash-text disabled:opacity-40"
            onClick={centerOnDrone}
            disabled={telemetry.lat == null || telemetry.lng == null}
            aria-label="Center on drone"
            title="Center on drone"
          >
            <Crosshair className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-dash-border bg-dash-panel/95 text-dash-muted hover:text-dash-text"
            onClick={() => smoothZoom(1)}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-dash-border bg-dash-panel/95 text-dash-muted hover:text-dash-text"
            onClick={() => smoothZoom(-1)}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </DashboardCard>
  );
}
