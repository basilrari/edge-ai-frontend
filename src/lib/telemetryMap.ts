import type { DroneTelemetry } from "../components/types";
import type { Telemetry } from "../types/drone";

/** Fields the dashboard can show; `null` = not available from drone-http / MAVLink yet. */
export function mapDroneTelemetryToHud(live: DroneTelemetry | null): Telemetry {
  const ts = live?.ts_ms ?? Date.now();
  const mode = live?.mode ?? null;
  const armed = live?.armed ?? null;

  return {
    altitude: live?.alt_rel_m ?? null,
    speed: live?.groundspeed_m_s ?? live?.airspeed_m_s ?? null,
    batteryPercent: null,
    batteryTimeLeft: null,
    distanceFromHome: null,
    heading: live?.heading_deg ?? null,
    headingCardinal:
      live?.heading_deg != null ? headingToCardinal(live.heading_deg) : null,
    gpsSatellites: null,
    gimbalPitch: null,
    cameraMode: null,
    cameraFps: null,
    rcSignalLabel: null,
    rcSignalDbm: null,
    flightMode: mode,
    flightModeSub: armed === true ? "Armed" : armed === false ? "Disarmed" : null,
    homePoint: null,
    lastUpdateMs: ts,
    roll: live?.roll_deg ?? null,
    pitch: live?.pitch_deg ?? null,
    mode,
    armed,
    lat: live?.lat_deg ?? null,
    lng: live?.lon_deg ?? null,
    climbMps: live?.climb_m_s ?? null,
    link: live?.link ?? null,
    hasFix: live?.ok ?? false,
  };
}

function headingToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

/** Human-readable list of HUD fields not provided by the current backend. */
export const TELEMETRY_NOT_FROM_DRONE = [
  "Battery % and time remaining (no SYS_STATUS / BATTERY_STATUS on link)",
  "GPS satellite count (no GPS_RAW_INT on link)",
  "Distance from home (home lat/lon not exposed in telemetry API)",
  "Home point coordinates (only home altitude is cached server-side, not published)",
  "RC signal strength (no RADIO_STATUS on link)",
  "Gimbal pitch / camera settings (no gimbal MAVLink on link)",
  "Live map weather pill (24°C, wind — not from FC; hidden when using live data only)",
] as const;
