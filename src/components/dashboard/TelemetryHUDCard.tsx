"use client";

import React, { useMemo } from "react";
import { DashboardCard } from "./DashboardCard";
import type { Telemetry } from "../../types/drone";

interface Props {
  telemetry: Telemetry;
  secondsSinceUpdate?: number;
}

function BatteryRing({ percent }: { percent: number }): JSX.Element {
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg className="h-9 w-9 shrink-0" viewBox="0 0 36 36" aria-hidden>
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#1F2937"
        strokeWidth="3"
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#4ADE80"
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}

function GpsBars({ sats }: { sats: number }): JSX.Element {
  const level = Math.min(4, Math.ceil(sats / 5));
  return (
    <div className="mt-1 flex items-end gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-sm ${i <= level ? "bg-dash-accent" : "bg-dash-border"}`}
          style={{ height: 4 + i * 3 }}
        />
      ))}
    </div>
  );
}

function MetricTile({
  label,
  value,
  sub,
  extra,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  extra?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="metric-tile flex flex-col justify-between">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-dash-muted">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {extra}
        <div>
          <p className="text-base font-semibold tabular-nums leading-tight text-dash-text">
            {value}
          </p>
          {sub ? (
            <p className="mt-0.5 text-[10px] capitalize text-dash-muted">{sub}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TelemetryHUDCard({
  telemetry,
  secondsSinceUpdate = 2,
}: Props): JSX.Element {
  const hdg = String(Math.round(telemetry.heading)).padStart(3, "0");
  const homeStr = useMemo(
    () =>
      `${telemetry.homePoint.lat.toFixed(4)}, ${telemetry.homePoint.lng.toFixed(4)}`,
    [telemetry.homePoint.lat, telemetry.homePoint.lng]
  );
  const lastTime = new Date(telemetry.lastUpdate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <DashboardCard title="HUD / Telemetry" className="h-full" bodyClassName="p-3">
      <div className="grid grid-cols-3 gap-2">
        <MetricTile
          label="Altitude"
          value={`${telemetry.altitude.toFixed(1)} m`}
          sub="AGL"
        />
        <MetricTile
          label="Speed"
          value={`${telemetry.speed.toFixed(1)} m/s`}
          sub="Ground"
        />
        <MetricTile
          label="Battery"
          value={`${telemetry.batteryPercent}%`}
          sub={`${telemetry.batteryTimeLeft.toFixed(0)} min left`}
          extra={<BatteryRing percent={telemetry.batteryPercent} />}
        />
        <MetricTile
          label="Distance"
          value={`${telemetry.distanceFromHome.toFixed(2)} km`}
          sub="From Home"
        />
        <MetricTile
          label="Heading"
          value={`${hdg}°`}
          sub={telemetry.headingCardinal ?? "—"}
        />
        <MetricTile
          label="GPS"
          value={String(telemetry.gpsSatellites)}
          sub="Satellites"
          extra={<GpsBars sats={telemetry.gpsSatellites} />}
        />
        <MetricTile label="Home Point" value={homeStr} sub="Lat, Lon" />
        <MetricTile
          label="RC Signal"
          value={telemetry.rcSignalLabel ?? "—"}
          sub={
            telemetry.rcSignalDbm != null
              ? `${telemetry.rcSignalDbm} dBm`
              : undefined
          }
        />
        <MetricTile
          label="Mode"
          value={telemetry.flightMode ?? telemetry.mode ?? "—"}
          sub={telemetry.flightModeSub ?? "Mission"}
        />
      </div>

      <p className="mt-3 border-t border-dash-border pt-2 text-[9px] uppercase tracking-wide text-dash-muted">
        Last Update{" "}
        <span className="font-mono normal-case text-dash-text">
          {lastTime} ({secondsSinceUpdate}s ago)
        </span>
      </p>
    </DashboardCard>
  );
}
