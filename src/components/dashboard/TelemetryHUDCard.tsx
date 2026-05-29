"use client";

import React from "react";
import { DashboardCard } from "./DashboardCard";
import type { Telemetry } from "../../types/drone";
import { fmtHeading, fmtInt, fmtNum } from "../../lib/format";
import { useTimeDisplayContext } from "./TimeDisplayProvider";

interface Props {
  telemetry: Telemetry;
  secondsSinceUpdate: number;
  fillHeight?: boolean;
}

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
        <p className="text-base font-semibold tabular-nums leading-tight text-dash-text">
          {value}
        </p>
        {sub ? (
          <p className="mt-0.5 text-[10px] capitalize text-dash-muted">{sub}</p>
        ) : null}
      </div>
    </div>
  );
}

function fmtDeg(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${fmtNum(v, 1)}°`;
}

export function TelemetryHUDCard({
  telemetry,
  secondsSinceUpdate,
  fillHeight = false,
}: Props): JSX.Element {
  const { formatLogTime } = useTimeDisplayContext();
  const lastTime = formatLogTime(telemetry.lastUpdateMs);

  const speedSub =
    telemetry.speed != null
      ? "Ground"
      : telemetry.airspeed != null
        ? "Air"
        : undefined;

  return (
    <DashboardCard
      title="HUD / Telemetry"
      className={fillHeight ? "h-full min-h-0" : undefined}
      bodyClassName="p-3"
    >
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
            telemetry.speed != null
              ? `${fmtNum(telemetry.speed)} m/s`
              : telemetry.airspeed != null
                ? `${fmtNum(telemetry.airspeed)} m/s`
                : "—"
          }
          sub={speedSub}
        />
        <MetricTile
          label="Climb"
          value={
            telemetry.climbMps != null
              ? `${fmtNum(telemetry.climbMps)} m/s`
              : "—"
          }
          sub="Vertical"
        />
        <MetricTile label="Roll" value={fmtDeg(telemetry.roll)} />
        <MetricTile label="Pitch" value={fmtDeg(telemetry.pitch)} />
        <MetricTile label="Yaw" value={fmtDeg(telemetry.yaw)} />
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
        <MetricTile
          label="Mode"
          value={telemetry.flightMode ?? telemetry.mode ?? "—"}
          sub={telemetry.flightModeSub ?? undefined}
        />
      </div>

      <p className="mt-3 border-t border-dash-border pt-2 text-[9px] uppercase tracking-wide text-dash-muted">
        Home Location{" "}
        <span className="font-mono normal-case text-dash-text">
          {telemetry.homeLat != null && telemetry.homeLng != null
            ? `${telemetry.homeLat.toFixed(5)}, ${telemetry.homeLng.toFixed(5)}${
                telemetry.homeAltM != null
                  ? ` · ${telemetry.homeAltM.toFixed(0)} m`
                  : ""
              }`
            : "—"}
        </span>
      </p>

      <p className="mt-2 text-[9px] uppercase tracking-wide text-dash-muted">
        Last Update{" "}
        <span className="font-mono normal-case text-dash-text">
          {lastTime} ({secondsSinceUpdate}s ago)
        </span>
      </p>
    </DashboardCard>
  );
}
