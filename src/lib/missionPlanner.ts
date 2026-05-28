import type { DroneMission } from "../components/types";

export interface PlannerWaypoint {
  id: string;
  lat: number;
  lng: number;
  altM: number;
}

export interface MissionPlannerDraft {
  includeTakeoff: boolean;
  takeoffAltM: number;
  includeRtl: boolean;
  defaultAltM: number;
  waypoints: PlannerWaypoint[];
}

export interface MissionUploadBody {
  include_takeoff: boolean;
  takeoff_alt_m: number;
  include_rtl: boolean;
  waypoints: { lat_deg: number; lon_deg: number; alt_m: number }[];
}

export function newWaypointId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `wp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const DEFAULT_PLANNER_DRAFT: MissionPlannerDraft = {
  includeTakeoff: true,
  takeoffAltM: 15,
  includeRtl: true,
  defaultAltM: 15,
  waypoints: [],
};

export function draftToUploadBody(draft: MissionPlannerDraft): MissionUploadBody {
  return {
    include_takeoff: draft.includeTakeoff,
    takeoff_alt_m: draft.takeoffAltM,
    include_rtl: draft.includeRtl,
    waypoints: draft.waypoints.map((w) => ({
      lat_deg: w.lat,
      lon_deg: w.lng,
      alt_m: w.altM,
    })),
  };
}

/** Preview stats/legs from the draft before upload. */
export function draftToPreviewMission(draft: MissionPlannerDraft): DroneMission | null {
  if (draft.waypoints.length === 0 && !draft.includeTakeoff) return null;

  const waypoints: DroneMission["waypoints"] = [];
  let seq = 0;

  if (draft.includeTakeoff) {
    waypoints.push({
      seq,
      lat_deg: 0,
      lon_deg: 0,
      alt_m: draft.takeoffAltM,
      command: 22,
    });
    seq += 1;
  }

  for (const w of draft.waypoints) {
    waypoints.push({
      seq,
      lat_deg: w.lat,
      lon_deg: w.lng,
      alt_m: w.altM,
      command: 16,
    });
    seq += 1;
  }

  if (draft.includeRtl) {
    waypoints.push({
      seq,
      lat_deg: 0,
      lon_deg: 0,
      alt_m: 0,
      command: 20,
    });
  }

  return { ok: true, waypoints };
}
