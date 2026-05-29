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
      <div className="dashboard-panel flex h-[320px] items-center justify-center text-sm text-dash-muted">
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
    <AppShell pageTitle="Mission Control">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <MissionPromptCard
              onSend={handleSendPrompt}
              loading={promptLoading}
              error={promptError}
              successMessage={promptSuccess}
            />
          </div>
          <div className="relative z-0 lg:col-span-3">
            <LiveMapCard
              activeWaypoints={waypoints}
              telemetry={telemetry}
              heightPx={320}
              mapMaxZoom={MAP_MAX_ZOOM}
              maptilerApiKey={maptilerApiKey}
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
            <MissionOverviewCard
              legs={missionLegs}
              stats={missionStats}
              loading={missionLoading}
              error={missionError}
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
    </AppShell>
  );
}
