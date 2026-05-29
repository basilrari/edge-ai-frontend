/** Mission waypoint helpers (aligned with TUI `format.rs` command labels). */

import type { DroneMission, MissionWaypoint } from "../components/types";
import {
  EMPTY_MISSION_STATS,
  type MissionLeg,
  type MissionOverviewStats,
} from "../types/drone";

type LegStatus = MissionLeg["status"];

const CMD = {
  WAYPOINT: 16,
  TAKEOFF: 22,
  LAND: 21,
  RTL: 20,
  SPLINE: 82,
  LOITER_TO_ALT: 31,
} as const;

const DEFAULT_SPEED_MPS = 5;

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

/** ArduPilot TAKEOFF/RTL items often use 0,0 — those legs must not affect path length. */
function hasValidPosition(wp: MissionWaypoint): boolean {
  if (!Number.isFinite(wp.lat_deg) || !Number.isFinite(wp.lon_deg)) return false;
  if (Math.abs(wp.lat_deg) < 1e-5 && Math.abs(wp.lon_deg) < 1e-5) return false;
  if (Math.abs(wp.lat_deg) > 90 || Math.abs(wp.lon_deg) > 180) return false;
  return true;
}

/** Mission items that define a geographic point on the flown path. */
function isPathWaypoint(wp: MissionWaypoint): boolean {
  if (
    wp.command === CMD.WAYPOINT ||
    wp.command === CMD.SPLINE ||
    wp.command === CMD.LOITER_TO_ALT
  ) {
    return hasValidPosition(wp);
  }
  if (wp.command === CMD.LAND) return hasValidPosition(wp);
  return false;
}

function pathWaypointsInOrder(wps: MissionWaypoint[]): MissionWaypoint[] {
  return wps.filter(isPathWaypoint);
}

function countNavWaypoints(wps: MissionWaypoint[]): number {
  return wps.filter(
    (wp) =>
      wp.command === CMD.WAYPOINT ||
      wp.command === CMD.SPLINE ||
      wp.command === CMD.LOITER_TO_ALT
  ).length;
}

function pathDistanceM(points: MissionWaypoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const horizontal = haversineM(a.lat_deg, a.lon_deg, b.lat_deg, b.lon_deg);
    const vertical = Math.abs(b.alt_m - a.alt_m);
    total += Math.sqrt(horizontal ** 2 + vertical ** 2);
  }
  return total;
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
  mission: DroneMission | null,
  groundspeedMps?: number | null
): MissionOverviewStats {
  if (!mission?.waypoints?.length) return EMPTY_MISSION_STATS;

  const wps = mission.waypoints;
  const path = pathWaypointsInOrder(wps);
  const totalM = pathDistanceM(path);

  const altCandidates = wps
    .filter(
      (w) =>
        w.command === CMD.TAKEOFF ||
        w.command === CMD.WAYPOINT ||
        w.command === CMD.SPLINE ||
        w.command === CMD.LOITER_TO_ALT
    )
    .map((w) => w.alt_m);
  const maxAlt = altCandidates.length > 0 ? Math.max(...altCandidates) : 0;

  const speed =
    groundspeedMps != null && groundspeedMps > 0.5
      ? groundspeedMps
      : DEFAULT_SPEED_MPS;
  const estTimeSec = totalM > 0 ? totalM / speed : 0;

  const legs = buildMissionLegs(mission);

  return {
    waypointCount: countNavWaypoints(wps),
    totalDistanceKm: totalM / 1000,
    estTimeSec,
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

export function formatEstTime(sec: number): string {
  if (sec <= 0) return "—";
  if (sec < 60) return `${Math.round(sec)} s`;
  if (sec < 3600) return `${Math.round(sec / 60)} min`;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
