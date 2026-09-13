import type { DroneTelemetry } from "../components/types";
import type { Telemetry } from "../types/drone";
const STALE_MS = 3000;
const FIX_3D_PLUS = new Set([
  "3D",
  "DGPS",
  "RTK_FLT",
  "RTK_FIX",
  "STATIC",
  "PPP",
]);

export function isFreshTelemetry(
  live: DroneTelemetry | null,
  nowMs = Date.now()
): boolean {
  if (!live || live.ok === false || live.ts_ms == null) return false;
  return nowMs - live.ts_ms <= STALE_MS;
}

export function is3dPlusFix(fix?: string | null): boolean {
  return !!fix && FIX_3D_PLUS.has(fix);
}

/** Fields the dashboard can show; `null` = not available from drone-http / MAVLink yet. */
export function mapDroneTelemetryToHud(
  live: DroneTelemetry | null,
  nowMs = Date.now(),
  positionLive: DroneTelemetry | null = live
): Telemetry {
  const freshPos = isFreshTelemetry(positionLive, nowMs);
  const hasFix = freshPos && is3dPlusFix(positionLive?.gps_fix);
  const mode = live?.mode ?? null;
  const armed = live?.armed ?? null;
  const rawV = live?.battery_voltage_v;
  const batteryVoltageV =
    rawV != null && Number.isFinite(rawV) && rawV > 0 && rawV <= 60
      ? rawV
      : null;
  const batteryCurrentA = live?.battery_current_a ?? null;
  const batteryPowerW =
    batteryVoltageV != null &&
    batteryCurrentA != null &&
    Number.isFinite(batteryCurrentA)
      ? batteryVoltageV * batteryCurrentA
      : (live?.battery_power_w ?? null);

  return {
    altitude: live?.alt_rel_m ?? null,
    speed: live?.groundspeed_m_s ?? null,
    airspeed: live?.airspeed_m_s ?? null,
    heading: live?.heading_deg ?? null,
    headingCardinal:
      live?.heading_deg != null ? headingToCardinal(live.heading_deg) : null,
    gpsSatellites: live?.gps_sats ?? null,
    gpsFix: live?.gps_fix ?? null,
    flightMode: mode,
    flightModeSub: armed === true ? "Armed" : armed === false ? "Disarmed" : null,
    lastUpdateMs: positionLive?.ts_ms ?? null,
    roll: live?.roll_deg ?? null,
    pitch: live?.pitch_deg ?? null,
    yaw: live?.yaw_deg ?? null,
    armed,
    lat: hasFix ? positionLive?.lat_deg ?? null : null,
    lng: hasFix ? positionLive?.lon_deg ?? null : null,
    climbMps: live?.climb_m_s ?? null,
    homeLat: live?.home_lat_deg ?? null,
    homeLng: live?.home_lon_deg ?? null,
    homeAltM: live?.home_alt_m ?? null,
    batteryVoltageV,
    batteryCurrentA,
    batteryPowerW,
    batteryRemainingPct: live?.battery_remaining_pct ?? null,
    link: live?.link ?? null,
    hasFix,
  };
}

function headingToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
