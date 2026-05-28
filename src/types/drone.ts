export interface Telemetry {
  altitude: number | null;
  altitudeAmsl?: number | null;
  speed: number | null;
  airspeed?: number | null;
  heading: number | null;
  headingCardinal?: string | null;
  gpsSatellites: number | null;
  flightMode?: string | null;
  flightModeSub?: string | null;
  lastUpdateMs: number;
  roll?: number | null;
  pitch?: number | null;
  yaw?: number | null;
  mode?: string | null;
  armed?: boolean | null;
  lat?: number | null;
  lng?: number | null;
  climbMps?: number | null;
  link?: import("../components/types").DroneLinkInfo | null;
  hasFix?: boolean;
}

export interface MissionLeg {
  id: number;
  seq: number;
  label: string;
  subtitle?: string;
  status: MissionLegStatus;
}

export type MissionLegStatus = "completed" | "in_progress" | "pending";

export interface MissionOverviewStats {
  waypointCount: number;
  totalDistanceKm: number;
  estTimeSec: number;
  maxAltitudeM: number;
  progressPercent: number;
}

export interface Waypoint {
  id: number;
  lat: number;
  lng: number;
  order: number;
}

export interface DroneStatus {
  id: string;
  name: string;
  model: string;
  firmware: string;
  isOnline: boolean;
}

export const EMPTY_MISSION_STATS: MissionOverviewStats = {
  waypointCount: 0,
  totalDistanceKm: 0,
  estTimeSec: 0,
  maxAltitudeM: 0,
  progressPercent: 0,
};
