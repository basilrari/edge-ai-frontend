"use client";

import L from "leaflet";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Loader2, MapPin, X } from "lucide-react";

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

export interface LocationMapPickerProps {
  onAppendToPrompt: (snippet: string) => void;
}

export function LocationMapPicker({ onAppendToPrompt }: LocationMapPickerProps): JSX.Element {
  const defaultCenter = useMemo<[number, number]>(() => [23.558, 120.473], []);
  const icon = useMemo(() => createMarkerIcon(), []);

  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isLoadingInitialLocation, setIsLoadingInitialLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(16);

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const MIN_ZOOM = 2;
  const MAX_ZOOM = 19;

  const updateMarker = useCallback(
    (next: [number, number] | null) => {
      if (!mapRef.current) return;
      if (!next) {
        if (markerRef.current) {
          mapRef.current.removeLayer(markerRef.current);
          markerRef.current = null;
        }
        return;
      }
      if (!markerRef.current) {
        markerRef.current = L.marker(next, { icon }).addTo(mapRef.current);
      } else {
        markerRef.current.setLatLng(next);
      }
    },
    [icon]
  );

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
            setPosition(next);
            setMapCenter(next);
            setZoomLevel(16);
            if (mapRef.current) {
              mapRef.current.setView(next, 16, { animate: true });
              updateMarker(next);
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
    [updateMarker]
  );

  useEffect(() => {
    let active = true;
    setIsLoadingInitialLocation(true);
    void (async () => {
      await tryLocateUser(() => {
        if (!active) return;
        setMapCenter(defaultCenter);
        setPosition(defaultCenter);
        setZoomLevel(16);
      });
      if (active) setIsLoadingInitialLocation(false);
    })();
    return () => {
      active = false;
    };
  }, [defaultCenter, tryLocateUser]);

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
      setPosition(next);
      setMapCenter(next);
      updateMarker(next);
    });

    map.on("zoomend", () => {
      setZoomLevel(map.getZoom());
    });

    mapRef.current = map;
    updateMarker(position);

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapOpen, mapCenter, zoomLevel, position, updateMarker]);

  const handleLocateMe = () => {
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
    if (!position) return;
    const [lat, lon] = position;
    onAppendToPrompt(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    setMapOpen(false);
  };

  const handleClear = () => {
    setPosition(null);
    updateMarker(null);
  };

  return (
    <div className="border-t border-cyan-500/15 pt-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-300">
          <MapPin className="h-4 w-4 shrink-0 text-cyan-300" />
          <p className="truncate">Add a location to your prompt or inject waypoints.</p>
        </div>
        <button type="button" className="outline w-full sm:w-auto" onClick={() => setMapOpen(true)}>
          Select on map
        </button>
      </div>

      {mapOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-3">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/90 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-cyan-500/15 px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-slate-100">Select waypoint</h3>
                <p className="text-[11px] text-slate-500">Click map to place/update the point.</p>
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

            <div className="relative">
              {isLoadingInitialLocation || !mapCenter ? (
                <div className="flex h-[70vh] min-h-[420px] flex-col items-center justify-center gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting your location...
                  </span>
                </div>
              ) : (
                <div className="relative h-[70vh] min-h-[420px]">
                  <div ref={mapContainerRef} className="h-full w-full" />

                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="absolute right-3 top-3 z-[500] inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyan-500/40 bg-slate-900/85 text-cyan-200 shadow-md transition hover:bg-slate-800 disabled:opacity-60"
                    title="Center on my location"
                    aria-label="Center on my location"
                  >
                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                  </button>

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
                      disabled={!position}
                    >
                      Append to prompt
                    </button>
                    <button
                      type="button"
                      className="outline bg-slate-900/85"
                      onClick={handleClear}
                      disabled={!position}
                    >
                      Clear point
                    </button>
                  </div>

                  {position && (
                    <div className="pointer-events-none absolute bottom-3 left-1/2 z-[500] -translate-x-1/2 rounded-md border border-cyan-500/25 bg-slate-950/80 px-2.5 py-1 text-[11px] font-mono text-slate-200">
                      {position[0].toFixed(6)}, {position[1].toFixed(6)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {locationError && (
              <div className="border-t border-cyan-500/15 px-4 py-2 text-[11px] text-amber-300">
                {locationError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
