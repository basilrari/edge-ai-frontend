"use client";

import React from "react";
import { AppShell } from "./AppShell";
import { LiveCameraCard } from "./LiveCameraCard";
import {
  FloodInferenceCard,
  HumanInferenceCard,
  InferenceLogCard,
  InferencePerfCard,
  InferenceStatusCard,
} from "./InferenceMetricsCards";
import { useModelServer } from "../../hooks/useModelServer";

export function CameraLayout(): JSX.Element {
  const { view, connected, error, logs } = useModelServer();

  return (
    <AppShell pageTitle="Camera" lockViewport>
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="shrink-0">
          <h1 className="text-base font-semibold text-dash-text">Camera</h1>
          <p className="allow-wrap text-[11px] text-dash-muted">
            Live video (WebRTC) plus Drone_LLM inference stats: flood, human,
            performance, and localization.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-12">
          <div className="flex min-h-0 flex-col xl:col-span-7">
            <LiveCameraCard fullHeight />
          </div>
          <div className="flex min-h-0 flex-col gap-2 xl:col-span-5">
            <InferenceStatusCard
              view={view}
              connected={connected}
              error={error}
            />
            <FloodInferenceCard flood={view.flood} fillHeight />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-12">
          <div className="flex min-h-0 flex-col xl:col-span-4">
            <HumanInferenceCard human={view.human} fillHeight />
          </div>
          <div className="flex min-h-0 flex-col xl:col-span-4">
            <InferencePerfCard
              perf={view.perf}
              live={view.inferenceActive}
              fillHeight
            />
          </div>
          <div className="flex min-h-0 flex-col xl:col-span-4">
            <InferenceLogCard logs={logs} fillHeight />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
