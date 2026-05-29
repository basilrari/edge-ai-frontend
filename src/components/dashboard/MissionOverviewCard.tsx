"use client";

import React from "react";
import clsx from "clsx";
import { DashboardCard } from "./DashboardCard";
import type { MissionLeg, MissionOverviewStats } from "../../types/drone";
import { formatEstTime, formatLegCoords } from "../../lib/missionUtils";

interface Props {
  legs: MissionLeg[];
  stats: MissionOverviewStats;
  loading?: boolean;
  error?: string | null;
}

function LegDot({ status }: { status: MissionLeg["status"] }): JSX.Element {
  const cls =
    status === "completed"
      ? "bg-dash-accent ring-dash-accent/40"
      : status === "in_progress"
        ? "bg-dash-blue ring-dash-blue/40 animate-pulse"
        : "bg-dash-muted/50 ring-dash-border";
  return (
    <span
      className={clsx(
        "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2",
        cls
      )}
    />
  );
}

function StatBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div className="allow-wrap min-w-0 overflow-hidden rounded-md border border-dash-border bg-dash-bg/60 px-3 py-2">
      <p className="allow-wrap text-[9px] font-semibold uppercase tracking-wider text-dash-muted">
        {label}
      </p>
      <p className="allow-wrap mt-0.5 text-lg font-semibold tabular-nums text-dash-text">
        {value}
      </p>
    </div>
  );
}

export function MissionOverviewCard({
  legs,
  stats,
  loading,
  error,
}: Props): JSX.Element {
  const empty = legs.length === 0;

  return (
    <DashboardCard title="Mission Overview" bodyClassName="flex flex-col gap-3 p-3">
      <div className="grid min-w-0 grid-cols-2 gap-2 xl:grid-cols-4">
        <StatBlock label="Waypoints" value={String(stats.waypointCount)} />
        <StatBlock
          label="Total Distance"
          value={
            stats.totalDistanceKm > 0
              ? `${stats.totalDistanceKm.toFixed(2)} km`
              : "—"
          }
        />
        <StatBlock label="Est. Time" value={formatEstTime(stats.estTimeSec)} />
        <StatBlock
          label="Max Altitude"
          value={
            stats.maxAltitudeM > 0 ? `${stats.maxAltitudeM.toFixed(0)} m` : "—"
          }
        />
      </div>

      {!empty && (
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] text-dash-muted">
            <span>Mission progress</span>
            <span className="font-semibold text-dash-accent">
              {stats.progressPercent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-dash-border">
            <div
              className="h-full rounded-full bg-dash-accent transition-all duration-500"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="max-h-[200px] overflow-y-auto rounded-md border border-dash-border bg-dash-bg/40">
        {loading && empty && (
          <p className="p-4 text-center text-xs text-dash-muted">
            Loading mission from drone…
          </p>
        )}
        {error && empty && (
          <p className="p-4 text-center text-xs text-dash-amber">{error}</p>
        )}
        {!loading && empty && !error && (
          <p className="p-4 text-center text-xs text-dash-muted">
            No mission on the link yet. Plan and upload from the Mission page in
            the sidebar.
          </p>
        )}
        {!empty && (
          <ul className="divide-y divide-dash-border">
            {legs.map((leg, idx) => (
              <li
                key={leg.id}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5",
                  leg.status === "in_progress" && "bg-dash-blue/5"
                )}
              >
                <LegDot status={leg.status} />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-[10px] font-mono text-dash-muted">
                      {idx + 1}.
                    </span>
                    <span
                      className={clsx(
                        "truncate text-sm font-medium",
                        leg.status === "completed"
                          ? "text-dash-text"
                          : leg.status === "in_progress"
                            ? "text-dash-blue"
                            : "text-dash-muted"
                      )}
                    >
                      {leg.label}
                    </span>
                    {leg.status === "in_progress" && (
                      <span className="shrink-0 rounded bg-dash-blue/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-dash-blue">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-dash-muted">
                    {formatLegCoords(leg)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardCard>
  );
}
