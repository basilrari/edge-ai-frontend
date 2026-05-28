"use client";

import L from "leaflet";
import React, { useCallback, useEffect, useRef } from "react";
import { Crosshair, Minus, Navigation, Plus } from "lucide-react";
import clsx from "clsx";
import "leaflet/dist/leaflet.css";
import { DashboardCard } from "./DashboardCard";
import type { Telemetry, Waypoint } from "../../types/drone";
import type { PlannerWaypoint } from "../../lib/missionPlanner";
import { addSatelliteBasemap } from "../../lib/mapBasemap";
import { MAP_MAX_ZOOM } from "../../lib/mapConstants";

interface Props {
  activeWaypoints: Waypoint[];
  plannerWaypoints?: PlannerWaypoint[];
  telemetry: Telemetry;
  operator?: { lat: number; lng: number } | null;
  plannerMode?: boolean;
  followDrone?: boolean;
  onFollowChange?: (follow: boolean) => void;
  onMapClick?: (lat: number, lng: number) => void;
  heightPx?: number;
  mapMaxZoom?: number;
  maptilerApiKey?: string;
  initialZoom?: number;
}

const DEFAULT_CENTER: [number, number] = [23.558, 120.473];
const DEFAULT_HEIGHT_PX = 320;
const DEFAULT_INITIAL_ZOOM = 18;

export function LiveMapCard({
  activeWaypoints,
  plannerWaypoints = [],
  telemetry,
  operator = null,
  plannerMode = false,
  followDrone = false,
  onFollowChange,
  onMapClick,
  heightPx = DEFAULT_HEIGHT_PX,
  mapMaxZoom = MAP_MAX_ZOOM,
  maptilerApiKey,
  initialZoom = DEFAULT_INITIAL_ZOOM,
}: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const activeLayerRef = useRef<L.LayerGroup | null>(null);
  const plannerLayerRef = useRef<L.LayerGroup | null>(null);
  const droneRef = useRef<L.CircleMarker | null>(null);
  const operatorRef = useRef<L.CircleMarker | null>(null);

  const showOperator = operator != null;
  const showFollow = followDrone && onFollowChange != null;

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
      maxZoom: mapMaxZoom,
      scrollWheelZoom: true,
      zoomSnap: 0,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 40,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 2800,
    }).setView(center, initialZoom);

    addSatelliteBasemap(map, mapMaxZoom, maptilerApiKey);
    L.control.scale({ imperial: false, maxWidth: 120 }).addTo(map);

    activeLayerRef.current = L.layerGroup().addTo(map);
    plannerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      activeLayerRef.current = null;
      plannerLayerRef.current = null;
      droneRef.current = null;
      operatorRef.current = null;
    };
  }, [mapMaxZoom, maptilerApiKey, initialZoom]);

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

    if (showOperator && operator) {
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
  }, [telemetry.lat, telemetry.lng, operator, showOperator]);

  const smoothZoom = useCallback(
    (delta: number) => {
      const map = mapRef.current;
      if (!map) return;
      const next = Math.max(
        map.getMinZoom(),
        Math.min(map.getMaxZoom(), map.getZoom() + delta)
      );
      map.flyTo(map.getCenter(), next, { duration: 0.35, easeLinearity: 0.25 });
    },
    []
  );

  const centerOnDrone = useCallback(() => {
    const map = mapRef.current;
    if (!map || telemetry.lat == null || telemetry.lng == null) return;
    onFollowChange?.(true);
    map.flyTo([telemetry.lat, telemetry.lng], initialZoom, {
      duration: 0.45,
      easeLinearity: 0.25,
    });
  }, [telemetry.lat, telemetry.lng, onFollowChange, initialZoom]);

  const gpsLabel = telemetry.hasFix ? "GPS fix" : "Waiting for GPS";

  return (
    <DashboardCard
      title="Live Map"
      className={heightPx > DEFAULT_HEIGHT_PX ? "h-full min-h-0" : undefined}
      bodyClassName="relative overflow-hidden p-0"
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
        style={{ height: heightPx }}
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
          </div>
          {(showOperator || plannerWaypoints.length > 0) && (
            <div className="rounded-md border border-dash-border bg-dash-panel/95 px-2.5 py-1.5 text-[10px] text-dash-muted backdrop-blur-sm">
              <span className="mr-2 inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-dash-accent" />
                Drone
              </span>
              {showOperator ? (
                <span className="mr-2 inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-dash-blue" />
                  Operator
                </span>
              ) : null}
              {plannerWaypoints.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-dash-amber" />
                  Plan
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="absolute right-3 top-3 z-[400] flex flex-col gap-1">
          {showFollow ? (
            <button
              type="button"
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-md border backdrop-blur-sm",
                followDrone
                  ? "border-dash-accent/50 bg-dash-accent/15 text-dash-accent"
                  : "border-dash-border bg-dash-panel/95 text-dash-muted hover:text-dash-text"
              )}
              onClick={() => onFollowChange?.(!followDrone)}
              aria-label="Toggle follow drone"
              title={followDrone ? "Following drone" : "Follow drone off"}
            >
              <Navigation className="h-4 w-4" />
            </button>
          ) : null}
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
