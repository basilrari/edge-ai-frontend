"use client";

import React from "react";
import clsx from "clsx";
import { DashboardCard } from "./DashboardCard";
import type {
  FloodView,
  HumanView,
  ModelDashboardView,
  PerfView,
} from "../../lib/modelPayload";

function MetricTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}): JSX.Element {
  return (
    <div className="metric-tile flex flex-col justify-between">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-dash-muted">
        {label}
      </p>
      <div className="mt-1">
        <p className="allow-wrap text-base font-semibold tabular-nums leading-tight text-dash-text">
          {value}
        </p>
        {sub ? (
          <p className="mt-0.5 text-[10px] text-dash-muted">{sub}</p>
        ) : null}
      </div>
    </div>
  );
}

function LiveDot({ live, label }: { live: boolean; label?: string }): JSX.Element {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-dash-muted">
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          live ? "bg-dash-accent animate-pulse" : "bg-dash-muted"
        )}
      />
      {label ?? (live ? "Live" : "Idle")}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <p className="text-[9px] font-semibold uppercase tracking-wider text-dash-muted">
      {children}
    </p>
  );
}

export function InferenceStatusCard({
  view,
  connected,
  error,
  fillHeight = false,
}: {
  view: ModelDashboardView;
  connected: boolean;
  error: string | null;
  fillHeight?: boolean;
}): JSX.Element {
  return (
    <DashboardCard
      title="Inference status"
      className={fillHeight ? "h-full min-h-0" : undefined}
      bodyClassName="dash-scroll flex min-h-0 flex-col gap-3 p-3"
      headerRight={
        <LiveDot
          live={connected && view.inferenceActive}
          label={connected ? (view.inferenceActive ? "Live" : "Idle") : "Offline"}
        />
      }
    >
      {error ? (
        <p className="allow-wrap text-[11px] text-dash-amber">{error}</p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <MetricTile label="Active task" value={view.activeTool} />
        <MetricTile label="System status" value={view.systemStatus} />
        <MetricTile label="Source" value={view.inputSource} />
        <MetricTile label="Device" value={view.cameraDevice} />
        <MetricTile label="Overlay" value={view.overlayMode} />
      </div>
      {view.gpsText ? (
        <p className="allow-wrap font-mono text-[11px] text-dash-muted">
          {view.gpsText}
        </p>
      ) : null}
    </DashboardCard>
  );
}

export function FloodInferenceCard({
  flood,
  fillHeight = false,
}: {
  flood: FloodView;
  fillHeight?: boolean;
}): JSX.Element {
  return (
    <DashboardCard
      title="Flood detection"
      className={fillHeight ? "h-full min-h-0" : undefined}
      bodyClassName="dash-scroll flex min-h-0 flex-col gap-3 p-3"
      headerRight={<LiveDot live={flood.show} />}
    >
      <div>
        <SectionLabel>Models</SectionLabel>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <MetricTile label="Active" value={flood.primaryModel} />
          <MetricTile
            label="Segmentation"
            value={flood.segPrimary}
            sub={`${flood.segMode} · ${flood.segBackend}`}
          />
          <MetricTile label="Skip" value={flood.segSkipped} />
          <MetricTile label="Segment" value={flood.segMs} />
        </div>
      </div>
      <div>
        <SectionLabel>Flood context</SectionLabel>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <MetricTile label="Altitude" value={flood.ctxAlt} />
          <MetricTile label="Priority" value={flood.ctxPriority} />
          <MetricTile label="Visibility" value={flood.ctxVisibility} />
          <MetricTile label="Flood ratio" value={flood.ctxFlood} />
          <MetricTile label="Classifier" value={flood.ctxClf} />
          <MetricTile label="Battery / CPU" value={flood.ctxPower} />
        </div>
      </div>
      <div>
        <SectionLabel>Flood result</SectionLabel>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <MetricTile label="Status" value={flood.classification} />
          <MetricTile label="Ratio" value={flood.floodRatio} />
        </div>
      </div>
      <div>
        <SectionLabel>Flood localization</SectionLabel>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <MetricTile label="Latitude" value={flood.lat} />
          <MetricTile label="Longitude" value={flood.lon} />
          <MetricTile label="Grid cell" value={flood.cell} />
          <MetricTile label="Cell ratio" value={flood.cellRatio} />
        </div>
      </div>
    </DashboardCard>
  );
}

export function HumanInferenceCard({
  human,
  fillHeight = false,
}: {
  human: HumanView;
  fillHeight?: boolean;
}): JSX.Element {
  return (
    <DashboardCard
      title="Human detection"
      className={fillHeight ? "h-full min-h-0" : undefined}
      bodyClassName="dash-scroll flex min-h-0 flex-col gap-3 p-3"
      headerRight={<LiveDot live={human.show} />}
    >
      <div className="grid grid-cols-2 gap-2">
        <MetricTile label="Active" value={human.primaryModel} />
        <MetricTile label="Tier mode" value={human.tierMode} />
        <MetricTile label="Backend" value={human.backend} />
        <MetricTile label="Switch" value={human.tierSwitch} />
      </div>
      <div>
        <SectionLabel>Human context</SectionLabel>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <MetricTile label="Altitude" value={human.ctxAlt} />
          <MetricTile label="Priority" value={human.ctxPriority} />
          <MetricTile label="Flood ratio" value={human.ctxFlood} />
          <MetricTile label="Battery" value={human.ctxBattery} />
        </div>
      </div>
      <div>
        <SectionLabel>Human result</SectionLabel>
        <div className="mt-1.5 grid grid-cols-1 gap-2">
          <MetricTile label="Detected" value={human.count} />
        </div>
        {human.list ? (
          <p className="allow-wrap mt-1.5 font-mono text-[10px] text-dash-muted">
            {human.list}
          </p>
        ) : null}
      </div>
      <div>
        <SectionLabel>Human localization</SectionLabel>
        <p className="allow-wrap mt-1.5 font-mono text-[10px] text-dash-muted">
          {human.gpsList}
        </p>
      </div>
    </DashboardCard>
  );
}

export function InferencePerfCard({
  perf,
  live,
  fillHeight = false,
}: {
  perf: PerfView;
  live: boolean;
  fillHeight?: boolean;
}): JSX.Element {
  return (
    <DashboardCard
      title="Performance & power"
      className={fillHeight ? "h-full min-h-0" : undefined}
      bodyClassName="dash-scroll p-3"
      headerRight={<LiveDot live={live} />}
    >
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        <MetricTile label="Latency (ms)" value={perf.latency} />
        <MetricTile label="FPS" value={perf.fps} />
        <MetricTile label="Memory (MB)" value={perf.memoryMb} />
        <MetricTile label="CPU (%)" value={perf.cpuPct} />
        <MetricTile label="Classify (ms)" value={perf.clfMs} />
        <MetricTile label="Segment (ms)" value={perf.segMs} />
        <MetricTile label="Detect (ms)" value={perf.detMs} />
        <MetricTile label="Idle (W)" value={perf.idleW} />
        <MetricTile label="Inference (W)" value={perf.inferenceW} />
        <MetricTile label="Extra (W)" value={perf.extraW} />
        <MetricTile label="Model switch" value={perf.modelSwitch} />
      </div>
    </DashboardCard>
  );
}

export function InferenceLogCard({
  logs,
  fillHeight = false,
}: {
  logs: string[];
  fillHeight?: boolean;
}): JSX.Element {
  return (
    <DashboardCard
      title="Log"
      className={fillHeight ? "h-full min-h-0" : undefined}
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-0"
    >
      <pre className="allow-wrap dash-scroll min-h-0 flex-1 overflow-y-auto bg-[#0b0e14] p-3 font-mono text-[11px] leading-relaxed text-dash-muted">
        {logs.length ? logs.join("\n") : "Waiting for model-server log lines…"}
      </pre>
    </DashboardCard>
  );
}
