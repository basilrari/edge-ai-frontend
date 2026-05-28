"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "./AppShell";
import { MissionPlannerCard } from "./MissionPlannerCard";
import { useTelemetry } from "../../hooks/useTelemetry";
import { useMission } from "../../hooks/useMission";
import { useOperatorLocation } from "../../hooks/useOperatorLocation";
import { GATEWAY_URL } from "../../lib/gateway";
import { MAP_MAX_ZOOM } from "../../lib/mapConstants";
import {
  DEFAULT_PLANNER_DRAFT,
  newWaypointId,
  type MissionPlannerDraft,
} from "../../lib/missionPlanner";

const LiveMapCard = dynamic(
  () => import("./LiveMapCard").then((m) => m.LiveMapCard),
  {
    ssr: false,
    loading: () => (
      <div className="dashboard-panel flex min-h-[520px] items-center justify-center text-sm text-dash-muted">
        Loading map…
      </div>
    ),
  }
);

export function MissionLayout(): JSX.Element {
  const gatewayUrl = GATEWAY_URL;
  const { telemetry } = useTelemetry(gatewayUrl);
  const {
    mission,
    loading: missionLoading,
    error: missionError,
    reload: reloadMission,
  } = useMission(gatewayUrl);
  const { position: operatorPosition } = useOperatorLocation();

  const [plannerDraft, setPlannerDraft] =
    useState<MissionPlannerDraft>(DEFAULT_PLANNER_DRAFT);
  const [followDrone, setFollowDrone] = useState(true);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPlannerDraft((draft) => ({
      ...draft,
      waypoints: [
        ...draft.waypoints,
        {
          id: newWaypointId(),
          lat,
          lng,
          altM: draft.defaultAltM,
        },
      ],
    }));
  }, []);

  const handleMissionUploaded = useCallback(() => {
    reloadMission();
    setPlannerDraft(DEFAULT_PLANNER_DRAFT);
  }, [reloadMission]);

  return (
    <AppShell pageTitle="Mission">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-3">
        <div className="grid min-h-[520px] grid-cols-1 gap-3 xl:grid-cols-5">
          <div className="relative z-0 xl:col-span-3">
            <LiveMapCard
              activeWaypoints={[]}
              plannerWaypoints={plannerDraft.waypoints}
              telemetry={telemetry}
              operator={operatorPosition}
              plannerMode
              followDrone={followDrone}
              onFollowChange={setFollowDrone}
              onMapClick={handleMapClick}
              heightPx={520}
              mapMaxZoom={MAP_MAX_ZOOM}
              initialZoom={20}
            />
          </div>
          <div className="xl:col-span-2">
            <MissionPlannerCard
              draft={plannerDraft}
              onDraftChange={setPlannerDraft}
              onMissionUploaded={handleMissionUploaded}
              onDroneMission={mission}
              droneMissionLoading={missionLoading}
              droneMissionError={missionError}
              groundspeedMps={telemetry.speed}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
