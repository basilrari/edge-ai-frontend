"use client";

import { useMemo } from "react";
import type { DroneTelemetry } from "../components/types";
import { MOCK_TELEMETRY } from "../lib/mockData";
import type { Telemetry } from "../types/drone";
import { useDroneTelemetryWs } from "./useDroneTelemetryWs";

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function headingToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function mapLiveToTelemetry(
  live: DroneTelemetry | null,
  connected: boolean,
  base: Telemetry
): Telemetry {
  if (!live || !connected) return base;

  const lat = live.lat_deg ?? base.lat;
  const lng = live.lon_deg ?? base.lng;
  const home = base.homePoint;
  const dist =
    lat != null && lng != null
      ? haversineKm(home.lat, home.lng, lat, lng)
      : base.distanceFromHome;

  return {
    ...base,
    altitude: live.alt_rel_m ?? base.altitude,
    speed: live.groundspeed_m_s ?? live.airspeed_m_s ?? base.speed,
    heading: live.heading_deg ?? base.heading,
    headingCardinal:
      live.heading_deg != null
        ? headingToCardinal(live.heading_deg)
        : base.headingCardinal,
    mode: live.mode ?? base.mode,
    armed: live.armed ?? base.armed,
    roll: live.roll_deg ?? base.roll,
    pitch: live.pitch_deg ?? base.pitch,
    lat,
    lng,
    distanceFromHome: dist,
    lastUpdate: new Date().toISOString(),
  };
}

export function useTelemetry(gatewayUrl: string): {
  telemetry: Telemetry;
  live: DroneTelemetry | null;
  connected: boolean;
} {
  const { telemetry: live, connected } = useDroneTelemetryWs(gatewayUrl);

  const telemetry = useMemo(
    () => mapLiveToTelemetry(live, connected, MOCK_TELEMETRY),
    [live, connected]
  );

  return { telemetry, live, connected };
}
