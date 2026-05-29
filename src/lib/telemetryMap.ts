import type { DroneTelemetry } from "../components/types";
import type { Telemetry } from "../types/drone";
import { normalizeBatteryVoltageV } from "./format";

/** Fields the dashboard can show; `null` = not available from drone-http / MAVLink yet. */
export function mapDroneTelemetryToHud(live: DroneTelemetry | null): Telemetry {
  const ts = live?.ts_ms ?? Date.now();
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
    gpsSatellites: null,
    flightMode: mode,
    flightModeSub: armed === true ? "Armed" : armed === false ? "Disarmed" : null,
    lastUpdateMs: ts,
    roll: live?.roll_deg ?? null,
    pitch: live?.pitch_deg ?? null,
    yaw: live?.yaw_deg ?? null,
    mode,
    armed,
    lat: live?.lat_deg ?? null,
    lng: live?.lon_deg ?? null,
    climbMps: live?.climb_m_s ?? null,
    homeLat: live?.home_lat_deg ?? null,
    homeLng: live?.home_lon_deg ?? null,
    homeAltM: live?.home_alt_m ?? null,
    batteryVoltageV,
    batteryCurrentA,
    batteryPowerW,
    batteryRemainingPct: live?.battery_remaining_pct ?? null,
    link: live?.link ?? null,
    hasFix: live?.ok ?? false,
  };
}

function headingToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
