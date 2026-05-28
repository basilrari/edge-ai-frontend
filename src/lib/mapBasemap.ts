import L from "leaflet";
import {
  LABELS_MAX_NATIVE_ZOOM,
  MAP_MAX_ZOOM,
  MAPTILER_MAX_NATIVE_ZOOM,
  SATELLITE_MAX_NATIVE_ZOOM,
} from "./mapConstants";

const ESRI_IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const MAPTILER_SATELLITE_URL =
  "https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=";

const LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png";

export type BasemapProvider = "maptiler" | "esri";

function addLabelsOverlay(map: L.Map, maxZoom: number): void {
  L.tileLayer(LABELS_URL, {
    subdomains: "abcd",
    maxZoom,
    maxNativeZoom: LABELS_MAX_NATIVE_ZOOM,
    detectRetina: false,
    opacity: 0.88,
  }).addTo(map);
}

function addEsriImagery(map: L.Map, maxZoom: number): L.TileLayer {
  return L.tileLayer(ESRI_IMAGERY_URL, {
    attribution:
      "Tiles © Esri — Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom,
    maxNativeZoom: SATELLITE_MAX_NATIVE_ZOOM,
    detectRetina: false,
    keepBuffer: 2,
  }).addTo(map);
}

function addMaptilerImagery(
  map: L.Map,
  maxZoom: number,
  apiKey: string,
  onFallback: () => void
): L.TileLayer {
  const layer = L.tileLayer(`${MAPTILER_SATELLITE_URL}${apiKey}`, {
    attribution: "© MapTiler © OpenStreetMap contributors",
    maxZoom,
    maxNativeZoom: MAPTILER_MAX_NATIVE_ZOOM,
    detectRetina: false,
    keepBuffer: 2,
  });

  let errorCount = 0;
  let fellBack = false;
  layer.on("tileerror", () => {
    errorCount += 1;
    if (!fellBack && errorCount >= 6) {
      fellBack = true;
      map.removeLayer(layer);
      addEsriImagery(map, maxZoom);
      onFallback();
    }
  });

  layer.addTo(map);
  return layer;
}

/**
 * Satellite basemap + dark labels.
 *
 * Prefer MapTiler when `maptilerApiKey` is set (native zoom 22). Falls back to
 * Esri with tile stretching if MapTiler tiles fail (invalid key, origin block).
 */
export function addSatelliteBasemap(
  map: L.Map,
  maxZoom: number = MAP_MAX_ZOOM,
  maptilerApiKey?: string | null,
  onProviderChange?: (provider: BasemapProvider) => void
): BasemapProvider {
  const key = maptilerApiKey?.trim();
  if (key) {
    onProviderChange?.("maptiler");
    addMaptilerImagery(map, maxZoom, key, () => onProviderChange?.("esri"));
    addLabelsOverlay(map, maxZoom);
    return "maptiler";
  }

  onProviderChange?.("esri");
  addEsriImagery(map, maxZoom);
  addLabelsOverlay(map, maxZoom);
  return "esri";
}
