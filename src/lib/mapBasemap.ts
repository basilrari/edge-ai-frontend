import L from "leaflet";
import { MAP_MAX_ZOOM, SATELLITE_MAX_NATIVE_ZOOM } from "./mapConstants";

const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";

export function addSatelliteBasemap(
  map: L.Map,
  maxZoom: number = MAP_MAX_ZOOM
): void {
  L.tileLayer(SATELLITE_TILE_URL, {
    maxZoom,
    maxNativeZoom: SATELLITE_MAX_NATIVE_ZOOM,
    detectRetina: true,
  }).addTo(map);

  L.tileLayer(SATELLITE_LABELS_URL, {
    subdomains: "abcd",
    maxZoom,
    maxNativeZoom: 20,
    detectRetina: true,
    opacity: 0.88,
  }).addTo(map);
}
