"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardSidebar } from "./DashboardSidebar";
import { BottomStatusBar } from "./BottomStatusBar";
import { MissionPromptCard } from "./MissionPromptCard";
import { TelemetryHUDCard } from "./TelemetryHUDCard";
import { MissionPlannerCard } from "./MissionPlannerCard";
import { FlightLogsCard } from "./FlightLogsCard";
import { useTelemetry } from "../../hooks/useTelemetry";
import { useMission } from "../../hooks/useMission";
import { useFlightLogs } from "../../hooks/useFlightLogs";
import { useOperatorLocation } from "../../hooks/useOperatorLocation";
import { GATEWAY_URL, sendInferPrompt } from "../../lib/gateway";
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
      <div className="dashboard-panel flex min-h-[480px] items-center justify-center text-sm text-dash-muted">
        Loading map…
      </div>
    ),
  }
);

export function DashboardLayout(): JSX.Element {
  const gatewayUrl = GATEWAY_URL;
  const { telemetry, live, connected, secondsSinceUpdate } =
    useTelemetry(gatewayUrl);
  const {
    waypoints,
    mission,
    loading: missionLoading,
    error: missionError,
    reload: reloadMission,
  } = useMission(gatewayUrl);
  const {
    entries: flightLogs,
    loading: logsLoading,
    error: logsError,
  } = useFlightLogs(gatewayUrl);
  const { position: operatorPosition } = useOperatorLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptSuccess, setPromptSuccess] = useState<string | null>(null);
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

  const handleSendPrompt = async (prompt: string) => {
    setPromptLoading(true);
    setPromptError(null);
    setPromptSuccess(null);
    try {
      const data = await sendInferPrompt(prompt);
      const tools =
        data.tools?.map((t) => `${t.category}:${t.name}`).join(" → ") ??
        (data.tool_name ? `${data.category}:${data.tool_name}` : null);

      if (data.drone_error) {
        setPromptError(data.drone_error);
      } else {
        setPromptSuccess(
          tools ? `Mission sent: ${tools}` : `Agent responded: ${data.action_taken}`
        );
      }
    } catch (e) {
      setPromptError(e instanceof Error ? e.message : "Failed to send prompt");
    } finally {
      setPromptLoading(false);
    }
  };

  const handleMissionUploaded = useCallback(() => {
    reloadMission();
    setPlannerDraft(DEFAULT_PLANNER_DRAFT);
  }, [reloadMission]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-dash-bg text-dash-text">
      <div className="flex min-h-0 flex-1">
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          droneOnline={connected}
          linkDisplay={live?.link?.display}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardNavbar
            droneOnline={connected}
            linkKind={live?.link?.kind}
            linkDisplay={live?.link?.display}
          />

          <main className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mx-auto flex max-w-[1680px] flex-col gap-3">
              <div className="grid min-h-[480px] grid-cols-1 gap-3 lg:grid-cols-5">
                <div className="flex lg:col-span-2">
                  <MissionPromptCard
                    onSend={handleSendPrompt}
                    loading={promptLoading}
                    error={promptError}
                    successMessage={promptSuccess}
                  />
                </div>
                <div className="relative z-0 min-h-[480px] lg:col-span-3">
                  <LiveMapCard
                    activeWaypoints={waypoints}
                    plannerWaypoints={plannerDraft.waypoints}
                    telemetry={telemetry}
                    operator={operatorPosition}
                    plannerMode
                    followDrone={followDrone}
                    onFollowChange={setFollowDrone}
                    onMapClick={handleMapClick}
                  />
                </div>
              </div>

              <div className="relative z-0 grid grid-cols-1 gap-3 xl:grid-cols-12">
                <div className="xl:col-span-3">
                  <TelemetryHUDCard
                    telemetry={telemetry}
                    secondsSinceUpdate={secondsSinceUpdate}
                  />
                </div>
                <div className="xl:col-span-6">
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
                <div className="xl:col-span-3">
                  <FlightLogsCard
                    entries={flightLogs}
                    loading={logsLoading}
                    error={logsError}
                  />
                </div>
              </div>
            </div>
          </main>

          <BottomStatusBar />
        </div>
      </div>
    </div>
  );
}
