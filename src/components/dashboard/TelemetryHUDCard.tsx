"use client";

import React from "react";
import { DashboardCard } from "./DashboardCard";
import type { Telemetry } from "../../types/drone";
import { fmtHeading, fmtInt, fmtNum } from "../../lib/format";

interface Props {
  telemetry: Telemetry;
  secondsSinceUpdate: number;
}

function BatteryRing({ percent }: { percent: number }): JSX.Element {
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg className="h-9 w-9 shrink-0" viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" stroke="#1F2937" strokeWidth="3" />
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
  secondsSinceUpdate,
}: Props): JSX.Element {
  const lastTime = new Date(telemetry.lastUpdateMs).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const homeStr =
    telemetry.homePoint != null
      ? `${telemetry.homePoint.lat.toFixed(4)}, ${telemetry.homePoint.lng.toFixed(4)}`
      : "—";

  return (
    <DashboardCard title="HUD / Telemetry" bodyClassName="p-3">
      <div className="grid grid-cols-3 gap-2">
        <MetricTile
          label="Altitude"
          value={
            telemetry.altitude != null ? `${fmtNum(telemetry.altitude)} m` : "—"
          }
          sub="AGL"
        />
        <MetricTile
          label="Speed"
          value={
            telemetry.speed != null ? `${fmtNum(telemetry.speed)} m/s` : "—"
          }
          sub="Ground"
        />
        <MetricTile
          label="Battery"
          value={
            telemetry.batteryPercent != null
              ? `${telemetry.batteryPercent}%`
              : "—"
          }
          sub={
            telemetry.batteryTimeLeft != null
              ? `${fmtNum(telemetry.batteryTimeLeft, 0)} min left`
              : "Not on link"
          }
          extra={
            telemetry.batteryPercent != null ? (
              <BatteryRing percent={telemetry.batteryPercent} />
            ) : undefined
          }
        />
        <MetricTile
          label="Distance"
          value={
            telemetry.distanceFromHome != null
              ? `${fmtNum(telemetry.distanceFromHome, 2)} km`
              : "—"
          }
          sub="From Home"
        />
        <MetricTile
          label="Heading"
          value={
            telemetry.heading != null ? `${fmtHeading(telemetry.heading)}°` : "—"
          }
          sub={telemetry.headingCardinal ?? undefined}
        />
        <MetricTile
          label="GPS"
          value={fmtInt(telemetry.gpsSatellites)}
          sub={telemetry.hasFix ? "3D fix" : "No fix yet"}
        />
        <MetricTile label="Home Point" value={homeStr} sub="Lat, Lon" />
        <MetricTile
          label="RC Signal"
          value={telemetry.rcSignalLabel ?? "—"}
          sub={
            telemetry.rcSignalDbm != null
              ? `${telemetry.rcSignalDbm} dBm`
              : "Not on link"
          }
        />
        <MetricTile
          label="Mode"
          value={telemetry.flightMode ?? telemetry.mode ?? "—"}
          sub={telemetry.flightModeSub ?? undefined}
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
