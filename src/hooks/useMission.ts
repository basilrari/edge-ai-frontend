"use client";

import { useEffect, useState } from "react";
import type { DroneMission } from "../components/types";
import { newRequestId } from "../lib/gateway";
import type { Waypoint } from "../types/drone";

function missionToWaypoints(mission: DroneMission | null): Waypoint[] {
  if (!mission?.waypoints?.length) return [];
  return mission.waypoints.map((w) => ({
    id: w.seq,
    lat: w.lat_deg,
    lng: w.lon_deg,
    order: w.seq,
  }));
}

export function useMission(gatewayUrl: string): {
  waypoints: Waypoint[];
  mission: DroneMission | null;
  loading: boolean;
  error: string | null;
} {
  const [mission, setMission] = useState<DroneMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${gatewayUrl}/drone/mission`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) throw new Error(`mission HTTP ${res.status}`);
        const data = (await res.json()) as DroneMission;
        if (active) {
          setMission(data);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "failed to load mission");
          setLoading(false);
        }
      }
    };

    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [gatewayUrl]);

  return {
    waypoints: missionToWaypoints(mission),
    mission,
    loading,
    error,
  };
}
