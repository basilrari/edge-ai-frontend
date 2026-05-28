import type {
  DroneStatus,
  MapWeatherOverlay,
  MissionLog,
  Telemetry,
  Waypoint,
} from "../types/drone";

/** Reference-screenshot defaults; live WS overrides position/speed/alt when connected. */
export const MOCK_TELEMETRY: Telemetry = {
  altitude: 120.4,
  speed: 18.6,
  batteryPercent: 76,
  batteryTimeLeft: 22,
  distanceFromHome: 1.24,
  heading: 45,
  headingCardinal: "NE",
  gpsSatellites: 19,
  gimbalPitch: -12.4,
  cameraMode: "4K",
  cameraFps: "30fps",
  cameraIso: 200,
  cameraShutter: "1/500",
  cameraEv: "-0.3",
  rcSignalLabel: "Strong",
  rcSignalDbm: -68,
  flightMode: "Auto",
  flightModeSub: "Mission",
  homePoint: { lat: 37.774929, lng: -122.419416 },
  lastUpdate: new Date().toISOString(),
  roll: -1.2,
  pitch: 3.5,
  mode: "AUTO",
  armed: true,
  lat: 37.7762,
  lng: -122.4178,
};

export const MOCK_DRONE: DroneStatus = {
  id: "drone-01",
  name: "DRONE-01",
  model: "DJI Mavic 3T",
  firmware: "v01.04.0200",
  isOnline: true,
  telemetry: MOCK_TELEMETRY,
};

export const MOCK_WAYPOINTS: Waypoint[] = [
  { id: 1, lat: 37.7728, lng: -122.422, order: 1 },
  { id: 2, lat: 37.774, lng: -122.4205, order: 2 },
  { id: 3, lat: 37.7752, lng: -122.419, order: 3 },
  { id: 4, lat: 37.7762, lng: -122.4178, order: 4 },
  { id: 5, lat: 37.7775, lng: -122.4162, order: 5 },
];

export const MOCK_MISSION_LOGS: MissionLog[] = [
  {
    id: "ml-1",
    missionName: "Bridge Inspection",
    date: "May 18, 2025",
    duration: "42 min",
    distance: "2.1 km",
    status: "Success",
  },
  {
    id: "ml-2",
    missionName: "Perimeter Scan",
    date: "May 17, 2025",
    duration: "28 min",
    distance: "1.8 km",
    status: "Success",
  },
  {
    id: "ml-3",
    missionName: "Site Survey A",
    date: "May 16, 2025",
    duration: "1h 12m",
    distance: "4.2 km",
    status: "Partial",
  },
  {
    id: "ml-4",
    missionName: "Thermal Grid B",
    date: "May 15, 2025",
    duration: "35 min",
    distance: "2.6 km",
    status: "Success",
  },
  {
    id: "ml-5",
    missionName: "Flood Recon North",
    date: "May 14, 2025",
    duration: "55 min",
    distance: "3.1 km",
    status: "Success",
  },
  {
    id: "ml-6",
    missionName: "Harbor Patrol",
    date: "May 12, 2025",
    duration: "48 min",
    distance: "2.9 km",
    status: "Partial",
  },
  {
    id: "ml-7",
    missionName: "Coastal Mapping",
    date: "May 10, 2025",
    duration: "22 min",
    distance: "1.2 km",
    status: "Success",
  },
  {
    id: "ml-8",
    missionName: "Emergency Survey",
    date: "May 8, 2025",
    duration: "1h 05m",
    distance: "5.0 km",
    status: "Failed",
  },
];

export const MOCK_MAP_WEATHER: MapWeatherOverlay = {
  temperatureC: 24,
  windSpeedKmh: 12,
  windDirection: "NE",
  gpsQuality: "Good GPS",
};

export const PROMPT_PLACEHOLDER =
  "Describe the mission you want the drone to execute… Example: Inspect the bridge and capture images of the supports from multiple angles at 30 m altitude.";

export const MAX_PROMPT_CHARS = 1500;

export const BRAND_NAME = "SAR CONTROL";
