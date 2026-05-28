"use client";

import React from "react";
import type { DroneTelemetry } from "./types";
import { Gauge, Navigation } from "lucide-react";

function fmt(n: number | undefined, digits = 1, suffix = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}${suffix}`;
}

interface Props {
  telemetry: DroneTelemetry | null;
  loading?: boolean;
}

export function DroneHud({ telemetry, loading }: Props): JSX.Element {
  const armed = telemetry?.armed;
  const mode = telemetry?.mode ?? "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold">Flight HUD</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              armed ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-300"
            }`}
          >
            {armed == null ? "—" : armed ? "ARMED" : "DISARMED"}
          </span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{mode}</span>
        </div>
      </div>

      {loading && !telemetry && (
        <p className="text-xs text-slate-500">Loading telemetry…</p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <HudCell label="Alt (rel)" value={`${fmt(telemetry?.alt_rel_m, 1)} m`} />
        <HudCell label="Alt (AMSL)" value={`${fmt(telemetry?.alt_amsl_m, 1)} m`} />
        <HudCell label="Ground speed" value={`${fmt(telemetry?.groundspeed_m_s, 1)} m/s`} />
        <HudCell label="Airspeed" value={`${fmt(telemetry?.airspeed_m_s, 1)} m/s`} />
        <HudCell label="Climb" value={`${fmt(telemetry?.climb_m_s, 1)} m/s`} />
        <HudCell label="Heading" value={`${fmt(telemetry?.heading_deg, 0)}°`} />
        <HudCell label="Roll" value={`${fmt(telemetry?.roll_deg, 1)}°`} />
        <HudCell label="Pitch" value={`${fmt(telemetry?.pitch_deg, 1)}°`} />
        <HudCell label="Yaw" value={`${fmt(telemetry?.yaw_deg, 1)}°`} />
      </div>

      {telemetry?.lat_deg != null && telemetry.lon_deg != null && (
        <p className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
          <Navigation className="h-3 w-3" />
          {telemetry.lat_deg.toFixed(6)}, {telemetry.lon_deg.toFixed(6)}
        </p>
      )}
    </div>
  );
}

function HudCell({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/70 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 font-mono text-sm text-slate-100">{value}</div>
    </div>
  );
}
