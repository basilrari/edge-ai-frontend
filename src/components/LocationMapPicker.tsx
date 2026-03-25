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
import { LocateFixed, MapPin } from "lucide-react";

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

  const handlePick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
  }, []);

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
    tryLocateUser();
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
              OpenStreetMap — no API key; same coordinates you’d get from WGS84
              maps.
            </p>
          </div>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">
        Click the map to drop a pin, then append to your prompt so the model
        knows where to operate.
      </p>

      <div className="relative h-56 w-full overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-950/50">
        {isLoadingInitialLocation || !mapCenter ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Getting your location...
          </div>
        ) : (
          <>
            <MapContainer
              center={mapCenter}
              zoom={zoomLevel}
              zoomControl={false}
              ref={mapRef}
              className="h-full w-full"
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
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
              className="absolute right-2 top-2 z-[500] inline-flex h-9 w-9 items-center justify-center rounded-md border border-cyan-500/40 bg-slate-900/85 text-cyan-200 shadow-md transition hover:bg-slate-800"
              title="Center on my location"
              aria-label="Center on my location"
            >
              <LocateFixed className="h-4 w-4" />
            </button>

            <div className="absolute bottom-2 right-2 z-[500] flex h-36 w-10 flex-col items-center rounded-md border border-cyan-500/35 bg-slate-900/85 py-2">
              <span className="text-[10px] font-semibold text-cyan-200">+</span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={1}
                value={zoomLevel}
                onChange={(e) => handleSliderZoomChange(Number(e.target.value))}
                className="my-1 h-24 w-6 cursor-pointer appearance-none bg-transparent [writing-mode:vertical-lr] [&::-webkit-slider-runnable-track]:w-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-cyan-500/40 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-200"
                aria-label="Zoom slider"
              />
              <span className="text-[10px] font-semibold text-cyan-200">-</span>
            </div>
          </>
        )}
      </div>

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
