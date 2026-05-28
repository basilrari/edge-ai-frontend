"use client";

import { useEffect, useState } from "react";
import type { DroneMission } from "../components/types";
import { MOCK_WAYPOINTS } from "../lib/mockData";
import { newRequestId } from "../lib/gateway";
import type { Waypoint } from "../types/drone";

function missionToWaypoints(mission: DroneMission | null): Waypoint[] {
  if (!mission?.waypoints?.length) return MOCK_WAYPOINTS;
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
} {
  const [mission, setMission] = useState<DroneMission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${gatewayUrl}/drone/mission`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) return;
        const data = (await res.json()) as DroneMission;
        if (active) {
          setMission(data);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
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
  };
}
