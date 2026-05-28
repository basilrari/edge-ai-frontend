/** Mission waypoint helpers (aligned with TUI `format.rs` command labels). */

import type { DroneMission, MissionWaypoint } from "../components/types";
import {
  EMPTY_MISSION_STATS,
  type MissionLeg,
  type MissionOverviewStats,
} from "../types/drone";

export type LegStatus = MissionLeg["status"];

const CMD = {
  WAYPOINT: 16,
  TAKEOFF: 22,
  LAND: 21,
  RTL: 20,
  SPLINE: 82,
  LOITER_TO_ALT: 31,
} as const;

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
  return `CMD ${wp.command}`;
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
  if (!mission?.waypoints?.length) return [];

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
  if (!mission?.waypoints?.length) return EMPTY_MISSION_STATS;

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
  const legs = buildMissionLegs(mission);
  const avgSpeedMps = 5;
  const estMin =
    totalM > 0 ? Math.max(1, Math.round(totalM / avgSpeedMps / 60)) : 0;

  return {
    waypointCount: wps.length,
    totalDistanceKm: totalM / 1000,
    estTimeMin: estMin,
    maxAltitudeM: maxAlt,
    progressPercent: progressFromLegs(legs),
  };
}

export function progressFromLegs(legs: MissionLeg[]): number {
  if (legs.length === 0) return 0;
  const done = legs.filter((l) => l.status === "completed").length;
  const active = legs.some((l) => l.status === "in_progress") ? 0.5 : 0;
  return Math.round(((done + active) / legs.length) * 100);
}

/** Est. time is computed from path length ÷ 5 m/s — not from the FC. */
export const MISSION_EST_TIME_IS_ESTIMATED = true;
