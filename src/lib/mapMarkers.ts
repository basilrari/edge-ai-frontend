import L from "leaflet";

const PIN_SIZE = 22;

/** Leaflet pane name for the live drone marker (above default markerPane). */
export const DRONE_MAP_PANE = "dronePane";

export const DRONE_MARKER_Z_INDEX = 10000;
export const HOME_MARKER_Z_INDEX = 100;

/** ~8 m — drone and home pins overlap on the pad. */
export function positionsNearM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  thresholdM = 8
): boolean {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= thresholdM;
}

export type MapPinVariant = "drone-plan" | "planner" | "home";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Numbered waypoint / home pin for mission overlays. */
export function numberedMapIcon(
  label: string,
  variant: MapPinVariant
): L.DivIcon {
  const variantClass = {
    "drone-plan": "map-pin map-pin--drone-plan",
    planner: "map-pin map-pin--planner",
    home: "map-pin map-pin--home",
  }[variant];

  return L.divIcon({
    className: "map-pin-host",
    html: `<div class="${variantClass}" aria-hidden="true">${escapeHtml(label)}</div>`,
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
  });
}

/** Live drone position with optional heading wedge (degrees, 0 = north). */
export function droneMapIcon(
  headingDeg: number | null,
  elevated = false
): L.DivIcon {
  const heading =
    headingDeg != null && Number.isFinite(headingDeg) ? headingDeg : null;
  const headingHtml =
    heading != null
      ? `<div class="map-drone__heading" style="transform: rotate(${heading}deg)"><span class="map-drone__arrow"></span></div>`
      : "";
  const elevatedClass = elevated ? " map-drone--elevated" : "";

  return L.divIcon({
    className: "map-drone-host",
    html: `<div class="map-drone${elevatedClass}">${headingHtml}<div class="map-drone__body"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#4ADE80" stroke="#052e16" stroke-width="1.5"/><path fill="#052e16" d="M12 3.5 13.6 8.4 18.5 10 13.6 11.6 12 16.5 10.4 11.6 5.5 10 10.4 8.4Z"/><circle cx="12" cy="12" r="1.6" fill="#052e16"/></svg></div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}
