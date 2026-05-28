"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardSidebar } from "./DashboardSidebar";
import { BottomStatusBar } from "./BottomStatusBar";
import { MissionPromptCard } from "./MissionPromptCard";
import { TelemetryHUDCard } from "./TelemetryHUDCard";
import { MissionOverviewCard } from "./MissionOverviewCard";
import { FlightLogsCard } from "./FlightLogsCard";
import { MOCK_MISSION_LOGS } from "../../lib/mockData";
import { buildMissionLegs, computeMissionStats } from "../../lib/missionUtils";
import { useTelemetry } from "../../hooks/useTelemetry";
import { useMission } from "../../hooks/useMission";
import type { ApiResponse } from "../types";
import type { MissionLog } from "../../types/drone";
import { GATEWAY_URL, sendInferPrompt } from "../../lib/gateway";

const LiveMapCard = dynamic(
  () => import("./LiveMapCard").then((m) => m.LiveMapCard),
  {
    ssr: false,
    loading: () => (
      <div className="dashboard-panel flex min-h-[320px] items-center justify-center text-sm text-dash-muted">
        Loading map…
      </div>
    ),
  }
);

function inferToLogEntry(data: ApiResponse, prompt: string): MissionLog {
  const failed =
    data.drone_error != null ||
    (data.action_taken?.includes("failed") ?? false) ||
    (data.action_taken?.includes("rejected") ?? false);

  return {
    id: `infer-${data.request_id ?? Date.now()}`,
    missionName: prompt.slice(0, 40) + (prompt.length > 40 ? "…" : ""),
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    duration: `${Math.max(1, Math.round((data.latency_ms ?? 0) / 1000))}s`,
    distance: "—",
    status: failed ? "Partial" : "Success",
  };
}

export function DashboardLayout(): JSX.Element {
  const gatewayUrl = GATEWAY_URL;
  const { telemetry, connected } = useTelemetry(gatewayUrl);
  const { waypoints, mission, loading: missionLoading } = useMission(gatewayUrl);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const missionLegs = useMemo(() => buildMissionLegs(mission), [mission]);
  const missionStats = useMemo(() => computeMissionStats(mission), [mission]);

  const secondsSinceUpdate = useMemo(() => {
    const t = new Date(telemetry.lastUpdate).getTime();
    return Math.max(0, Math.round((Date.now() - t) / 1000));
  }, [telemetry.lastUpdate]);

  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptSuccess, setPromptSuccess] = useState<string | null>(null);
  const [missionLogs, setMissionLogs] = useState<MissionLog[]>(MOCK_MISSION_LOGS);

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

      setMissionLogs((prev) =>
        [inferToLogEntry(data, prompt), ...prev].slice(0, 12)
      );
    } catch (e) {
      setPromptError(e instanceof Error ? e.message : "Failed to send prompt");
    } finally {
      setPromptLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-dash-bg text-dash-text">
      <div className="flex min-h-0 flex-1">
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          droneOnline={connected}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardNavbar
            droneOnline={connected}
            batteryPercent={telemetry.batteryPercent}
          />

          <main className="min-h-0 flex-1 overflow-auto p-3">
            <div className="mx-auto flex h-full max-w-[1680px] flex-col gap-3">
              <div className="grid min-h-[340px] grid-cols-1 gap-3 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <MissionPromptCard
                    onSend={handleSendPrompt}
                    loading={promptLoading}
                    error={promptError}
                    successMessage={promptSuccess}
                  />
                </div>
                <div className="lg:col-span-3">
                  <LiveMapCard waypoints={waypoints} telemetry={telemetry} />
                </div>
              </div>

              <div className="grid min-h-[300px] grid-cols-1 gap-3 xl:grid-cols-12">
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
                  />
                </div>
                <div className="xl:col-span-3">
                  <FlightLogsCard logs={missionLogs} />
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
