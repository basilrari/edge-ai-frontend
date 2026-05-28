"use client";

import L from "leaflet";
import React, { useCallback, useEffect, useRef } from "react";
import { Crosshair, Minus, Navigation, Plus } from "lucide-react";
import clsx from "clsx";
import "leaflet/dist/leaflet.css";
import { DashboardCard } from "./DashboardCard";
import type { Telemetry, Waypoint } from "../../types/drone";
import type { PlannerWaypoint } from "../../lib/missionPlanner";
import { fmtLinkKind } from "../../lib/format";

interface Props {
  activeWaypoints: Waypoint[];
  plannerWaypoints?: PlannerWaypoint[];
  telemetry: Telemetry;
  operator: { lat: number; lng: number } | null;
  plannerMode?: boolean;
  followDrone: boolean;
  onFollowChange: (follow: boolean) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [23.558, 120.473];
const MAP_MIN_HEIGHT_PX = 480;
const INITIAL_ZOOM = 18;

const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";

function addSatelliteBasemap(map: L.Map): void {
  L.tileLayer(SATELLITE_TILE_URL, { maxZoom: 19, detectRetina: true }).addTo(
    map
  );
  L.tileLayer(SATELLITE_LABELS_URL, {
    subdomains: "abcd",
    maxZoom: 20,
    detectRetina: true,
    opacity: 0.88,
  }).addTo(map);
}

export function LiveMapCard({
  activeWaypoints,
  plannerWaypoints = [],
  telemetry,
  operator,
  plannerMode = false,
  followDrone,
  onFollowChange,
  onMapClick,
}: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const activeLayerRef = useRef<L.LayerGroup | null>(null);
  const plannerLayerRef = useRef<L.LayerGroup | null>(null);
  const droneRef = useRef<L.CircleMarker | null>(null);
  const operatorRef = useRef<L.CircleMarker | null>(null);
  const userInteractedRef = useRef(false);

  const center: [number, number] =
    telemetry.lat != null && telemetry.lng != null
      ? [telemetry.lat, telemetry.lng]
      : operator
        ? [operator.lat, operator.lng]
        : activeWaypoints[0]
          ? [activeWaypoints[0].lat, activeWaypoints[0].lng]
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
    }).setView(center, INITIAL_ZOOM);

    addSatelliteBasemap(map);
    L.control.scale({ imperial: false, maxWidth: 120 }).addTo(map);

    activeLayerRef.current = L.layerGroup().addTo(map);
    plannerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const markUser = () => {
      userInteractedRef.current = true;
    };
    map.on("zoomstart", markUser);
    map.on("dragstart", markUser);

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (plannerMode && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.off("click");
      map.off("zoomstart", markUser);
      map.off("dragstart", markUser);
      map.remove();
      mapRef.current = null;
      activeLayerRef.current = null;
      plannerLayerRef.current = null;
      droneRef.current = null;
      operatorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => {
      if (plannerMode && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [plannerMode, onMapClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !followDrone) return;
    if (telemetry.lat == null || telemetry.lng == null) return;
    map.flyTo([telemetry.lat, telemetry.lng], map.getZoom(), {
      duration: 0.75,
      easeLinearity: 0.25,
    });
  }, [telemetry.lat, telemetry.lng, followDrone]);

  useEffect(() => {
    const layer = activeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (activeWaypoints.length > 1) {
      const latlngs = activeWaypoints.map(
        (w) => [w.lat, w.lng] as [number, number]
      );
      L.polyline(latlngs, {
        color: "#3B82F6",
        weight: 3,
        opacity: 0.85,
        dashArray: "6 4",
      }).addTo(layer);
      activeWaypoints.forEach((w) => {
        L.circleMarker([w.lat, w.lng], {
          radius: 6,
          color: "#93C5FD",
          fillColor: "#3B82F6",
          fillOpacity: 0.85,
          weight: 2,
        }).addTo(layer);
      });
    }
  }, [activeWaypoints]);

  useEffect(() => {
    const layer = plannerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (plannerWaypoints.length > 1) {
      const latlngs = plannerWaypoints.map(
        (w) => [w.lat, w.lng] as [number, number]
      );
      L.polyline(latlngs, {
        color: "#FBBF24",
        weight: 3,
        opacity: 0.95,
      }).addTo(layer);
    }
    plannerWaypoints.forEach((w, i) => {
      L.circleMarker([w.lat, w.lng], {
        radius: 8,
        color: "#FDE68A",
        fillColor: "#FBBF24",
        fillOpacity: 0.95,
        weight: 2,
      })
        .bindTooltip(`Plan ${i + 1} · ${w.altM.toFixed(0)} m`)
        .addTo(layer);
    });
  }, [plannerWaypoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (telemetry.lat != null && telemetry.lng != null) {
      const pos: [number, number] = [telemetry.lat, telemetry.lng];
      if (droneRef.current) {
        droneRef.current.setLatLng(pos);
      } else {
        droneRef.current = L.circleMarker(pos, {
          radius: 11,
          color: "#052e16",
          fillColor: "#4ADE80",
          fillOpacity: 1,
          weight: 3,
        })
          .bindTooltip("Drone")
          .addTo(map);
      }
    }

    if (operator) {
      const pos: [number, number] = [operator.lat, operator.lng];
      if (operatorRef.current) {
        operatorRef.current.setLatLng(pos);
      } else {
        operatorRef.current = L.circleMarker(pos, {
          radius: 9,
          color: "#1D4ED8",
          fillColor: "#3B82F6",
          fillOpacity: 0.95,
          weight: 2,
        })
          .bindTooltip("Operator")
          .addTo(map);
      }
    }
  }, [telemetry.lat, telemetry.lng, operator]);

  const smoothZoom = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    userInteractedRef.current = true;
    const next = Math.max(
      map.getMinZoom(),
      Math.min(map.getMaxZoom(), map.getZoom() + delta)
    );
    map.flyTo(map.getCenter(), next, { duration: 0.35, easeLinearity: 0.25 });
  }, []);

  const centerOnDrone = useCallback(() => {
    const map = mapRef.current;
    if (!map || telemetry.lat == null || telemetry.lng == null) return;
    onFollowChange(true);
    map.flyTo([telemetry.lat, telemetry.lng], INITIAL_ZOOM, {
      duration: 0.45,
      easeLinearity: 0.25,
    });
  }, [telemetry.lat, telemetry.lng, onFollowChange]);

  const gpsLabel = telemetry.hasFix ? "GPS fix" : "Waiting for GPS";
  const linkLabel = fmtLinkKind(telemetry.link?.kind);

  return (
    <DashboardCard
      title="Live Map"
      className="h-full min-h-0"
      bodyClassName="relative min-h-0 flex-1 overflow-hidden p-0"
      headerRight={
        plannerMode ? (
          <span className="text-[10px] font-medium text-dash-amber">
            Click map to add waypoints
          </span>
        ) : null
      }
    >
      <div
        className="relative isolate w-full"
        style={{ minHeight: MAP_MIN_HEIGHT_PX, height: "100%" }}
      >
        <div ref={containerRef} className="absolute inset-0 z-0" />

        <div className="pointer-events-none absolute left-3 top-3 z-[400] flex flex-col gap-2">
          <div className="rounded-full border border-dash-border bg-dash-panel/95 px-3 py-1.5 text-[11px] text-dash-text backdrop-blur-sm">
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
          <div className="rounded-md border border-dash-border bg-dash-panel/95 px-2.5 py-1.5 text-[10px] text-dash-muted backdrop-blur-sm">
            <span className="mr-2 inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-dash-accent" />
              Drone
            </span>
            <span className="mr-2 inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-dash-blue" />
              Operator
            </span>
            {plannerWaypoints.length > 0 ? (
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-dash-amber" />
                Plan
              </span>
            ) : null}
          </div>
        </div>

        <div className="absolute right-3 top-3 z-[400] flex flex-col gap-1">
          <button
            type="button"
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-md border backdrop-blur-sm",
              followDrone
                ? "border-dash-accent/50 bg-dash-accent/15 text-dash-accent"
                : "border-dash-border bg-dash-panel/95 text-dash-muted hover:text-dash-text"
            )}
            onClick={() => onFollowChange(!followDrone)}
            aria-label="Toggle follow drone"
            title={followDrone ? "Following drone" : "Follow drone off"}
          >
            <Navigation className="h-4 w-4" />
          </button>
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
