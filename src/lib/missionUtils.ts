/** Mission waypoint helpers (aligned with TUI `format.rs` command labels). */

import type { DroneMission, MissionWaypoint } from "../components/types";
import type { MissionLeg, MissionOverviewStats } from "../types/drone";

export type LegStatus = MissionLeg["status"];

const CMD = {
  WAYPOINT: 16,
  TAKEOFF: 22,
  LAND: 21,
  RTL: 20,
  SPLINE: 82,
  LOITER_TO_ALT: 31,
} as const;

export function mavCmdLabel(cmd: number): string {
  switch (cmd) {
    case CMD.WAYPOINT:
      return "Waypoint";
    case CMD.TAKEOFF:
      return "Takeoff";
    case CMD.LAND:
      return "Land";
    case CMD.RTL:
      return "Return to Home";
    case CMD.SPLINE:
      return "Spline WP";
    case CMD.LOITER_TO_ALT:
      return "Loiter";
    default:
      return `CMD ${cmd}`;
  }
}

function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function legLabel(wp: MissionWaypoint, navIndex: number): string {
  if (wp.command === CMD.TAKEOFF) return "Takeoff";
  if (wp.command === CMD.RTL) return "Return to Home";
  if (wp.command === CMD.LAND) return "Land";
  if (
    wp.command === CMD.WAYPOINT ||
    wp.command === CMD.SPLINE ||
    wp.command === CMD.LOITER_TO_ALT
  ) {
    return `Waypoint ${navIndex}`;
  }
  return mavCmdLabel(wp.command);
}

function legSubtitle(wp: MissionWaypoint): string | undefined {
  if (wp.command === CMD.TAKEOFF) {
    return `Target alt ${wp.alt_m.toFixed(0)} m`;
  }
  if (
    wp.command === CMD.WAYPOINT ||
    wp.command === CMD.SPLINE ||
    wp.command === CMD.LOITER_TO_ALT
  ) {
    return `${wp.lat_deg.toFixed(5)}, ${wp.lon_deg.toFixed(5)} · ${wp.alt_m.toFixed(0)} m`;
  }
  return undefined;
}

function statusForSeq(
  seq: number,
  currentSeq: number | undefined
): LegStatus {
  if (currentSeq == null) return "pending";
  if (seq < currentSeq) return "completed";
  if (seq === currentSeq) return "in_progress";
  return "pending";
}

export function buildMissionLegs(mission: DroneMission | null): MissionLeg[] {
  if (!mission?.waypoints?.length) return MOCK_MISSION_LEGS;

  let navCount = 0;
  return mission.waypoints.map((wp) => {
    if (
      wp.command === CMD.WAYPOINT ||
      wp.command === CMD.SPLINE ||
      wp.command === CMD.LOITER_TO_ALT
    ) {
      navCount += 1;
    }
    return {
      id: wp.seq,
      seq: wp.seq,
      label: legLabel(wp, navCount),
      subtitle: legSubtitle(wp),
      status: statusForSeq(wp.seq, mission.current_seq),
    };
  });
}

export function computeMissionStats(
  mission: DroneMission | null
): MissionOverviewStats {
  if (!mission?.waypoints?.length) return MOCK_MISSION_STATS;

  const wps = mission.waypoints;
  let totalM = 0;
  for (let i = 1; i < wps.length; i++) {
    totalM += haversineM(
      wps[i - 1].lat_deg,
      wps[i - 1].lon_deg,
      wps[i].lat_deg,
      wps[i].lon_deg
    );
  }
  const maxAlt = Math.max(...wps.map((w) => w.alt_m));
  const avgSpeedMps = 5;
  const estMin = Math.max(1, Math.round(totalM / avgSpeedMps / 60));

  return {
    waypointCount: wps.length,
    totalDistanceKm: totalM / 1000,
    estTimeMin: estMin,
    maxAltitudeM: maxAlt,
    progressPercent: progressFromLegs(buildMissionLegs(mission)),
  };
}

export function progressFromLegs(legs: MissionLeg[]): number {
  if (legs.length === 0) return 0;
  const done = legs.filter((l) => l.status === "completed").length;
  const active = legs.some((l) => l.status === "in_progress") ? 0.5 : 0;
  return Math.round(((done + active) / legs.length) * 100);
}

export const MOCK_MISSION_LEGS: MissionLeg[] = [
  { id: 0, seq: 0, label: "Takeoff", subtitle: "Target alt 30 m", status: "completed" },
  { id: 1, seq: 1, label: "Waypoint 1", subtitle: "37.77400, -122.42000 · 80 m", status: "completed" },
  { id: 2, seq: 2, label: "Waypoint 2", subtitle: "37.77520, -122.41880 · 100 m", status: "in_progress" },
  { id: 3, seq: 3, label: "Waypoint 3", subtitle: "37.77620, -122.41780 · 120 m", status: "pending" },
  { id: 4, seq: 4, label: "Waypoint 4", status: "pending" },
  { id: 5, seq: 5, label: "Waypoint 5", status: "pending" },
  { id: 6, seq: 6, label: "Return to Home", status: "pending" },
];

export const MOCK_MISSION_STATS: MissionOverviewStats = {
  waypointCount: 6,
  totalDistanceKm: 2.48,
  estTimeMin: 18,
  maxAltitudeM: 120,
  progressPercent: 42,
};
