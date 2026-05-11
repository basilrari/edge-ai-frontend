"use client";

import L from "leaflet";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Loader2, MapPin, Plane, User, X } from "lucide-react";

function createMarkerIcon(): L.Icon {
  return new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

type MapFocus = "drone" | "you";

interface DronePositionJson {
  ok?: boolean;
  lat_deg?: number;
  lon_deg?: number;
  alt_amsl_m?: number;
  error?: string;
}

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `map-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface LocationMapPickerProps {
  onAppendToPrompt: (snippet: string) => void;
  /** When true, only the compact control row (for use beside Send prompt). */
  inline?: boolean;
  /** Gateway base URL (proxies `GET /drone/position` to drone-http). */
  gatewayBaseUrl?: string;
}

export function LocationMapPicker({
  onAppendToPrompt,
  inline = false,
  gatewayBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000",
}: LocationMapPickerProps): JSX.Element {
  const defaultCenter = useMemo<[number, number]>(() => [23.558, 120.473], []);
  const icon = useMemo(() => createMarkerIcon(), []);

  const [mapFocus, setMapFocus] = useState<MapFocus>("drone");
  /** Waypoint the operator clicked (for “Append to prompt”). */
  const [selection, setSelection] = useState<[number, number] | null>(null);
  /** Vehicle position from gateway → drone-http (updated every 5s in drone mode). */
  const [dronePosition, setDronePosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isLoadingInitialLocation, setIsLoadingInitialLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(16);

  const mapRef = useRef<L.Map | null>(null);
  const selectionMarkerRef = useRef<L.Marker | null>(null);
  const droneLayerRef = useRef<L.CircleMarker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const MIN_ZOOM = 2;
  const MAX_ZOOM = 19;

  const fetchDronePosition = useCallback(async (): Promise<[number, number] | null> => {
    try {
      const res = await fetch(`${gatewayBaseUrl.replace(/\/$/, "")}/drone/position`, {
        headers: { "x-request-id": newRequestId() },
      });
      const data = (await res.json()) as DronePositionJson;
      if (data.ok && typeof data.lat_deg === "number" && typeof data.lon_deg === "number") {
        return [data.lat_deg, data.lon_deg];
      }
      return null;
    } catch {
      return null;
    }
  }, [gatewayBaseUrl]);

  const updateSelectionMarker = useCallback(
    (next: [number, number] | null) => {
      if (!mapRef.current) return;
      if (!next) {
        if (selectionMarkerRef.current) {
          mapRef.current.removeLayer(selectionMarkerRef.current);
          selectionMarkerRef.current = null;
        }
        return;
      }
      if (!selectionMarkerRef.current) {
        selectionMarkerRef.current = L.marker(next, { icon }).addTo(mapRef.current);
      } else {
        selectionMarkerRef.current.setLatLng(next);
      }
    },
    [icon]
  );

  const updateDroneMarker = useCallback((next: [number, number] | null) => {
    if (!mapRef.current) return;
    if (!next || mapFocus !== "drone") {
      if (droneLayerRef.current) {
        mapRef.current.removeLayer(droneLayerRef.current);
        droneLayerRef.current = null;
      }
      return;
    }
    if (!droneLayerRef.current) {
      droneLayerRef.current = L.circleMarker(next, {
        radius: 9,
        color: "#22d3ee",
        weight: 2,
        fillColor: "#06b6d4",
        fillOpacity: 0.9,
      }).addTo(mapRef.current);
    } else {
      droneLayerRef.current.setLatLng(next);
    }
  }, [mapFocus]);

  const tryLocateUser = useCallback(
    (onFail?: () => void): Promise<void> =>
      new Promise((resolve) => {
        if (!navigator.geolocation) {
          setLocationError("Geolocation is not supported in this browser.");
          onFail?.();
          resolve();
          return;
        }

        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
          (result) => {
            const next: [number, number] = [result.coords.latitude, result.coords.longitude];
            setMapCenter(next);
            setZoomLevel(16);
            if (mapRef.current) {
              mapRef.current.setView(next, 16, { animate: true });
            }
            resolve();
          },
          () => {
            setLocationError("Could not access your location, using fallback start point.");
            onFail?.();
            resolve();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          }
        );
      }),
    []
  );

  /** When the modal opens or focus changes: set center source. */
  useEffect(() => {
    if (!mapOpen) return;

    let cancelled = false;
    setIsLoadingInitialLocation(true);
    setLocationError(null);

    void (async () => {
      if (mapFocus === "drone") {
        const pos = await fetchDronePosition();
        if (cancelled) return;
        if (pos) {
          setDronePosition(pos);
          setMapCenter(pos);
          setZoomLevel(16);
        } else {
          setDronePosition(null);
          setLocationError("No drone GPS yet (waiting for GLOBAL_POSITION_INT) or gateway unreachable.");
          setMapCenter(defaultCenter);
          setZoomLevel(12);
        }
      } else {
        await tryLocateUser(() => {
          if (cancelled) return;
          setMapCenter(defaultCenter);
        });
      }
      if (!cancelled) setIsLoadingInitialLocation(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [mapOpen, mapFocus, defaultCenter, fetchDronePosition, tryLocateUser]);

  useEffect(() => {
    if (!mapOpen || !mapCenter || !mapContainerRef.current) return;

    const container = mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (container._leaflet_id) delete container._leaflet_id;

    const map = L.map(container, { zoomControl: false, attributionControl: false }).setView(
      mapCenter,
      zoomLevel
    );

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Imagery © Esri" }
    ).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const next: [number, number] = [e.latlng.lat, e.latlng.lng];
      setSelection(next);
    });

    map.on("zoomend", () => {
      setZoomLevel(map.getZoom());
    });

    mapRef.current = map;

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      selectionMarkerRef.current = null;
      droneLayerRef.current = null;
    };
  }, [mapOpen, mapCenter, mapFocus]);

  useEffect(() => {
    if (!mapRef.current || !mapOpen) return;
    updateSelectionMarker(selection);
  }, [selection, mapOpen, updateSelectionMarker]);

  /** Drone position: refresh every 5s only while modal is open and focus is Drone. */
  useEffect(() => {
    if (!mapOpen || mapFocus !== "drone") return;

    const tick = () => {
      void (async () => {
        const pos = await fetchDronePosition();
        if (pos) {
          setDronePosition(pos);
          if (mapRef.current) {
            mapRef.current.panTo(pos, { animate: true });
          }
        }
      })();
    };

    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [mapOpen, mapFocus, fetchDronePosition]);

  /** Keep drone marker in sync when map exists. */
  useEffect(() => {
    if (!mapRef.current || !mapOpen) return;
    if (mapFocus === "drone" && dronePosition) {
      updateDroneMarker(dronePosition);
    } else {
      updateDroneMarker(null);
    }
  }, [dronePosition, mapFocus, mapOpen, updateDroneMarker]);

  const handleLocateMe = () => {
    if (mapFocus !== "you") return;
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }
    setIsLocating(true);
    void tryLocateUser().finally(() => setIsLocating(false));
  };

  const handleSliderZoomChange = (value: number) => {
    setZoomLevel(value);
    if (mapRef.current) mapRef.current.setZoom(value);
  };

  const handleAppend = () => {
    if (!selection) return;
    const [lat, lon] = selection;
    onAppendToPrompt(`{ "lat": ${lat.toFixed(6)}, "long": ${lon.toFixed(6)} }`);
    setMapOpen(false);
  };

  const handleClear = () => {
    setSelection(null);
    updateSelectionMarker(null);
  };

  const mapModal =
    mapOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-3"
        role="presentation"
        onClick={() => setMapOpen(false)}
      >
        <div
          className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/90 shadow-2xl backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-map-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3 border-b border-cyan-500/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 id="location-map-title" className="truncate text-sm font-medium text-slate-100">
                Select waypoint
              </h3>
              <p className="text-[11px] text-slate-500">
                Click map to place a waypoint. Cyan dot = drone (updates every 5s). Pin = your selection.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Map center</span>
              <div className="inline-flex rounded-lg border border-cyan-500/35 bg-slate-900/80 p-0.5">
                <button
                  type="button"
                  onClick={() => setMapFocus("drone")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                    mapFocus === "drone"
                      ? "bg-cyan-600 text-white shadow"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Plane className="h-3.5 w-3.5" />
                  Drone
                </button>
                <button
                  type="button"
                  onClick={() => setMapFocus("you")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                    mapFocus === "you"
                      ? "bg-cyan-600 text-white shadow"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  You
                </button>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-cyan-500/40 bg-slate-900/70 text-cyan-200 hover:bg-slate-800"
                onClick={() => setMapOpen(false)}
                aria-label="Close map"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            {isLoadingInitialLocation || !mapCenter ? (
              <div className="flex h-[70vh] min-h-[420px] flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mapFocus === "drone" ? "Getting drone location…" : "Getting your location…"}
                </span>
              </div>
            ) : (
              <div className="relative h-[70vh] min-h-[420px]">
                <div ref={mapContainerRef} className="h-full w-full" />

                {mapFocus === "you" && (
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="absolute right-3 top-3 z-[500] inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyan-500/40 bg-slate-900/85 text-cyan-200 shadow-md transition hover:bg-slate-800 disabled:opacity-60"
                    title="Center on my location"
                    aria-label="Center on my location"
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4" />
                    )}
                  </button>
                )}

                <div className="absolute bottom-3 right-3 z-[500] flex h-40 w-10 flex-col items-center rounded-md border border-cyan-500/35 bg-slate-900/85 py-3">
                  <span className="text-[10px] font-semibold text-cyan-200">+</span>
                  <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={1}
                    value={MAX_ZOOM + MIN_ZOOM - zoomLevel}
                    onChange={(e) => {
                      const sliderValue = Number(e.target.value);
                      const nextZoom = MAX_ZOOM + MIN_ZOOM - sliderValue;
                      handleSliderZoomChange(nextZoom);
                    }}
                    className="my-1 h-28 w-6 cursor-pointer appearance-none bg-transparent [writing-mode:vertical-lr] [&::-webkit-slider-runnable-track]:w-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-cyan-500/40 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-200"
                    aria-label="Zoom slider"
                  />
                  <span className="text-[10px] font-semibold text-cyan-200">-</span>
                </div>

                <div className="absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="outline bg-slate-900/85"
                    onClick={handleAppend}
                    disabled={!selection}
                  >
                    Append to prompt
                  </button>
                  <button
                    type="button"
                    className="outline bg-slate-900/85"
                    onClick={handleClear}
                    disabled={!selection}
                  >
                    Clear point
                  </button>
                </div>

                <div className="pointer-events-none absolute bottom-3 left-1/2 z-[500] max-w-[95%] -translate-x-1/2 space-y-1 text-center">
                  {mapFocus === "drone" && dronePosition && (
                    <div className="rounded-md border border-cyan-500/40 bg-slate-950/90 px-2.5 py-1 text-[11px] font-mono text-cyan-100">
                      Drone: {dronePosition[0].toFixed(6)}, {dronePosition[1].toFixed(6)} (5s refresh)
                    </div>
                  )}
                  {selection && (
                    <div className="rounded-md border border-cyan-500/25 bg-slate-950/80 px-2.5 py-1 text-[11px] font-mono text-slate-200">
                      Waypoint: {selection[0].toFixed(6)}, {selection[1].toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {locationError && (
            <div className="border-t border-cyan-500/15 px-4 py-2 text-[11px] text-amber-300">{locationError}</div>
          )}
        </div>
      </div>,
      document.body
    );

  const controlRow = (
    <div
      className={
        inline
          ? "flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-[min(100%,28rem)] sm:flex-row sm:items-center sm:gap-3"
          : "flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400 sm:text-sm sm:text-slate-300">
        <MapPin className="h-4 w-4 shrink-0 text-cyan-300" />
        <p className="min-w-0 truncate">Map centers on the drone; switch to You to use your location.</p>
      </div>
      <button
        type="button"
        className="outline w-full shrink-0 sm:w-auto"
        onClick={() => {
          setSelection(null);
          setMapOpen(true);
        }}
      >
        Select on map
      </button>
    </div>
  );

  return (
    <>
      {inline ? (
        controlRow
      ) : (
        <div className="border-t border-cyan-500/15 pt-4">{controlRow}</div>
      )}
      {mapModal}
    </>
  );
}
