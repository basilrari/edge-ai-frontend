"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "./AppShell";
import { MissionPromptCard } from "./MissionPromptCard";
import { TelemetryHUDCard } from "./TelemetryHUDCard";
import { MissionOverviewCard } from "./MissionOverviewCard";
import { FlightLogsCard } from "./FlightLogsCard";
import { buildMissionLegs, computeMissionStats } from "../../lib/missionUtils";
import { useTelemetry } from "../../hooks/useTelemetry";
import { useMission } from "../../hooks/useMission";
import { useFlightLogs } from "../../hooks/useFlightLogs";
import { GATEWAY_URL, sendInferPrompt } from "../../lib/gateway";
import { MAP_MAX_ZOOM } from "../../lib/mapConstants";

const LiveMapCard = dynamic(
  () => import("./LiveMapCard").then((m) => m.LiveMapCard),
  {
    ssr: false,
    loading: () => (
      <div className="dashboard-panel flex h-full min-h-[240px] items-center justify-center text-sm text-dash-muted">
        Loading map…
      </div>
    ),
  }
);

export function DashboardLayout({
  maptilerApiKey,
}: {
  maptilerApiKey?: string;
}): JSX.Element {
  const gatewayUrl = GATEWAY_URL;
  const { telemetry, secondsSinceUpdate } = useTelemetry(gatewayUrl);
  const {
    waypoints,
    mission,
    loading: missionLoading,
    error: missionError,
  } = useMission(gatewayUrl);
  const {
    entries: flightLogs,
    loading: logsLoading,
    error: logsError,
  } = useFlightLogs(gatewayUrl);

  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptSuccess, setPromptSuccess] = useState<string | null>(null);

  const missionLegs = useMemo(() => buildMissionLegs(mission), [mission]);
  const missionStats = useMemo(
    () => computeMissionStats(mission, telemetry.speed),
    [mission, telemetry.speed]
  );

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

  return (
    <AppShell pageTitle="Mission Control" lockViewport>
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="grid min-h-0 shrink-0 grid-cols-1 gap-2 lg:grid-cols-5 lg:h-[36%] lg:min-h-[220px] lg:max-h-[340px]">
          <div className="lg:col-span-2">
            <MissionPromptCard
              onSend={handleSendPrompt}
              loading={promptLoading}
              error={promptError}
              successMessage={promptSuccess}
            />
          </div>
          <div className="flex min-h-0 flex-col lg:col-span-3">
            <LiveMapCard
              activeWaypoints={waypoints}
              telemetry={telemetry}
              fillHeight
              mapMaxZoom={MAP_MAX_ZOOM}
              maptilerApiKey={maptilerApiKey}
              initialZoom={18}
            />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-12">
          <div className="flex min-h-0 flex-col xl:col-span-3">
            <TelemetryHUDCard
              telemetry={telemetry}
              secondsSinceUpdate={secondsSinceUpdate}
              fillHeight
            />
          </div>
          <div className="flex min-h-0 flex-col xl:col-span-6">
            <MissionOverviewCard
              legs={missionLegs}
              stats={missionStats}
              loading={missionLoading}
              error={missionError}
              fillHeight
            />
          </div>
          <div className="flex min-h-0 flex-col xl:col-span-3">
            <FlightLogsCard
              entries={flightLogs}
              loading={logsLoading}
              error={logsError}
              fillHeight
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
