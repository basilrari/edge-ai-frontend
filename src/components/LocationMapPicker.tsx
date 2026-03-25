"use client";

import L from "leaflet";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Loader2, MapPin, X } from "lucide-react";

function createMarkerIcon(): L.Icon {
  return new L.Icon({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

function MapInteractionHandler({
  onPick,
  onZoomChange,
}: {
  onPick: (lat: number, lng: number) => void;
  onZoomChange: (zoom: number) => void;
}): null {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
    zoomend(e) {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

export interface LocationMapPickerProps {
  /** Called with a single line the LLM can use as the geographic target. */
  onAppendToPrompt: (snippet: string) => void;
}

export function LocationMapPicker({
  onAppendToPrompt,
}: LocationMapPickerProps): JSX.Element {
  const defaultCenter = useMemo<[number, number]>(() => [23.558, 120.473], []);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isLoadingInitialLocation, setIsLoadingInitialLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(16);
  const icon = useMemo(() => createMarkerIcon(), []);
  const mapRef = useRef<L.Map | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const MIN_ZOOM = 2;
  const MAX_ZOOM = 19;

  const tryLocateUser = useCallback(
    (onFail?: () => void) => {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported in this browser.");
        onFail?.();
        return;
      }

      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (result) => {
          const { latitude, longitude } = result.coords;
          const current: [number, number] = [latitude, longitude];
          setPosition(current);
          setMapCenter(current);
          setZoomLevel(16);
          if (mapRef.current) {
            mapRef.current.setView(current, 16, { animate: true });
          }
        },
        () => {
          setLocationError("Could not access your location, using fallback start point.");
          onFail?.();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    },
    []
  );

  useEffect(() => {
    let active = true;
    tryLocateUser(() => {
      if (!active) return;
      setMapCenter(defaultCenter);
      setPosition(defaultCenter);
      setZoomLevel(16);
    });
    if (active) {
      setIsLoadingInitialLocation(false);
    }
    return () => {
      active = false;
    };
  }, [defaultCenter, tryLocateUser]);

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      const next: [number, number] = [lat, lng];
      setPosition(next);
      setMapCenter(next);
      // Selection is complete: close the map so the operator can continue.
      setMapOpen(false);
    },
    []
  );

  const buildSnippet = useCallback((): string => {
    if (!position) return "";
    const [lat, lon] = position;
    return (
      `[Map target — WGS84] latitude ${lat.toFixed(6)}, longitude ${lon.toFixed(6)}. ` +
      `Use this point as the primary geographic target for the mission unless the rest of the prompt conflicts.`
    );
  }, [position]);

  const handleAppend = () => {
    const snippet = buildSnippet();
    if (!snippet) return;
    onAppendToPrompt(snippet);
  };

  const handleClear = () => setPosition(null);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    setLocationError(null);
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        const { latitude, longitude } = result.coords;
        const current: [number, number] = [latitude, longitude];
        setPosition(current);
        setMapCenter(current);
        setZoomLevel(16);
        if (mapRef.current) {
          mapRef.current.setView(current, 16, { animate: true });
        }
        setIsLocating(false);
        setMapOpen(false);
      },
      (err) => {
        setLocationError(err.message || "Unable to retrieve your location.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const handleSliderZoomChange = (value: number) => {
    setZoomLevel(value);
    if (mapRef.current) {
      mapRef.current.setZoom(value);
    }
  };

  return (
    <div className="space-y-3 border-t border-cyan-500/15 pt-4">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-4 w-4 flex-shrink-0 text-cyan-300" />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-slate-100">
              Target location
            </h3>
            <p className="text-[11px] text-slate-500">
              Satellite imagery picker. Click to drop a pin, then append the
              coordinates to your prompt.
            </p>
          </div>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">
        Open the map to drop a pin, then append to your prompt so the model
        knows where to operate.
      </p>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 truncate text-[11px] text-slate-500">
          {position
            ? "Selected point is ready. You can edit it on the map."
            : "Select a satellite point to set your mission target."}
        </p>
        <button
          type="button"
          className="outline w-full sm:w-auto"
          onClick={() => setMapOpen(true)}
        >
          {position ? "Edit on map" : "Select on map"}
        </button>
      </div>

      {mapOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-3">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/90 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-cyan-500/15 px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-slate-100">
                  Pick target location
                </h3>
                <p className="text-[11px] text-slate-500">
                  Satellite. Click to drop a pin (selection closes map).
                </p>
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
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting your location...
                  </div>
                  <div className="text-[11px] text-slate-500">
                    If it fails, we’ll fall back to the configured coordinates.
                  </div>
                </div>
              ) : (
                <div className="h-[70vh] min-h-[420px]">
                  <MapContainer
                    center={mapCenter}
                    zoom={zoomLevel}
                    zoomControl={false}
                    attributionControl={false}
                    ref={mapRef}
                    className="h-full w-full"
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution="Imagery © Esri"
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    <MapInteractionHandler
                      onPick={handlePick}
                      onZoomChange={setZoomLevel}
                    />
                    {position && <Marker position={position} icon={icon} />}
                  </MapContainer>

                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="absolute right-3 top-3 z-[500] inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyan-500/40 bg-slate-900/85 text-cyan-200 shadow-md transition hover:bg-slate-800 disabled:opacity-60 disabled:hover:bg-slate-900/85"
                    title="Center on my location"
                    aria-label="Center on my location"
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4" />
                    )}
                  </button>

                  <div className="absolute bottom-3 right-3 z-[500] flex h-40 w-10 flex-col items-center rounded-md border border-cyan-500/35 bg-slate-900/85 py-3">
                    <span className="text-[10px] font-semibold text-cyan-200">
                      +
                    </span>
                    <input
                      type="range"
                      min={MIN_ZOOM}
                      max={MAX_ZOOM}
                      step={1}
                      // Invert slider direction so "slide up => zoom in"
                      value={MAX_ZOOM + MIN_ZOOM - zoomLevel}
                      onChange={(e) => {
                        const sliderValue = Number(e.target.value);
                        const nextZoom = MAX_ZOOM + MIN_ZOOM - sliderValue;
                        handleSliderZoomChange(nextZoom);
                      }}
                      className="my-1 h-28 w-6 cursor-pointer appearance-none bg-transparent [writing-mode:vertical-lr] [&::-webkit-slider-runnable-track]:w-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-cyan-500/40 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-200"
                      aria-label="Zoom slider"
                    />
                    <span className="text-[10px] font-semibold text-cyan-200">
                      -
                    </span>
                  </div>

                  <div className="pointer-events-none absolute bottom-2 left-2 z-[400] text-[10px] text-slate-400">
                    Imagery © Esri
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {locationError && (
        <p className="text-[11px] text-amber-300">{locationError}</p>
      )}

      {position && (
        <div className="rounded-lg border border-cyan-500/20 bg-slate-950/40 px-2.5 py-2 font-mono text-[11px] text-slate-300">
          <span className="text-slate-500">WGS84 </span>
          {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      )}

      <div className="flex min-w-0 flex-wrap gap-2">
        <button
          type="button"
          className="outline flex-1 sm:flex-none"
          onClick={handleAppend}
          disabled={!position}
        >
          Append to prompt
        </button>
        <button
          type="button"
          className="outline flex-1 sm:flex-none"
          onClick={handleClear}
          disabled={!position}
        >
          Clear point
        </button>
      </div>
    </div>
  );
}
