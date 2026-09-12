import type { DroneTelemetry } from "../components/types";
import type { Telemetry } from "../types/drone";
import { normalizeBatteryVoltageV } from "./format";

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
  if (!live) return false;
  if (live.ts_ms != null) return nowMs - live.ts_ms <= STALE_MS;
  return live.ok === true;
}

export function is3dPlusFix(fix?: string | null): boolean {
  return !!fix && FIX_3D_PLUS.has(fix);
}

/** Fields the dashboard can show; `null` = not available from drone-http / MAVLink yet. */
export function mapDroneTelemetryToHud(live: DroneTelemetry | null): Telemetry {
  const fresh = isFreshTelemetry(live);
  const hasFix = fresh && is3dPlusFix(live?.gps_fix);
  const ts = live?.ts_ms ?? 0;
  const mode = live?.mode ?? null;
  const armed = live?.armed ?? null;
  const batteryVoltageV = normalizeBatteryVoltageV(live?.battery_voltage_v);
  const batteryCurrentA = live?.battery_current_a ?? null;
  const batteryPowerW =
    batteryVoltageV != null &&
    batteryCurrentA != null &&
    Number.isFinite(batteryCurrentA)
      ? batteryVoltageV * batteryCurrentA
      : (live?.battery_power_w ?? null);

  return {
    altitude: live?.alt_rel_m ?? null,
    altitudeAmsl: live?.alt_amsl_m ?? null,
    speed: live?.groundspeed_m_s ?? null,
    airspeed: live?.airspeed_m_s ?? null,
    heading: live?.heading_deg ?? null,
    headingCardinal:
      live?.heading_deg != null ? headingToCardinal(live.heading_deg) : null,
    gpsSatellites: live?.gps_sats ?? null,
    gpsFix: live?.gps_fix ?? null,
    flightMode: mode,
    flightModeSub: armed === true ? "Armed" : armed === false ? "Disarmed" : null,
    lastUpdateMs: ts,
    roll: live?.roll_deg ?? null,
    pitch: live?.pitch_deg ?? null,
    yaw: live?.yaw_deg ?? null,
    mode,
    armed,
    lat: hasFix ? live?.lat_deg ?? null : null,
    lng: hasFix ? live?.lon_deg ?? null : null,
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
