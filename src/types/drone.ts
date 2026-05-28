/** Mission control dashboard domain types (spec + live bridge). */

export interface Telemetry {
  altitude: number;
  speed: number;
  batteryPercent: number;
  batteryTimeLeft: number;
  distanceFromHome: number;
  heading: number;
  headingCardinal?: string;
  gpsSatellites: number;
  gimbalPitch: number;
  cameraMode: string;
  cameraFps: string;
  cameraIso?: number;
  cameraShutter?: string;
  cameraEv?: string;
  rcSignalLabel?: string;
  rcSignalDbm?: number;
  flightMode?: string;
  flightModeSub?: string;
  homePoint: { lat: number; lng: number };
  lastUpdate: string;
  roll?: number;
  pitch?: number;
  mode?: string;
  armed?: boolean;
  lat?: number;
  lng?: number;
}

export interface MissionLog {
  id: string;
  missionName: string;
  date: string;
  duration: string;
  distance?: string;
  status: "Success" | "Partial" | "Failed" | "In Progress";
}

export type MissionLegStatus = "completed" | "in_progress" | "pending";

export interface MissionLeg {
  id: number;
  seq: number;
  label: string;
  subtitle?: string;
  status: MissionLegStatus;
}

export interface MissionOverviewStats {
  waypointCount: number;
  totalDistanceKm: number;
  estTimeMin: number;
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
  telemetry: Telemetry;
}

export interface MapWeatherOverlay {
  temperatureC: number;
  windSpeedKmh: number;
  windDirection: string;
  gpsQuality: string;
}
