"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { DashboardCard } from "./DashboardCard";
import type { FlightLogEntry } from "../types";

interface Props {
  entries: FlightLogEntry[];
  loading: boolean;
  error: string | null;
}

function levelClass(level: string): string {
  switch (level) {
    case "warn":
      return "text-dash-amber";
    case "error":
      return "text-red-400";
    default:
      return "text-dash-accent";
  }
}

export function FlightLogsCard({ entries, loading, error }: Props): JSX.Element {
  const rows = [...entries].reverse();

  return (
    <DashboardCard
      title="Flight Logs"
      bodyClassName="overflow-hidden p-0"
      headerRight={
        <Link
          href="/logs"
          className="text-[10px] font-medium text-dash-muted hover:text-dash-accent"
        >
          View all
        </Link>
      }
    >
      <div className="max-h-[280px] overflow-y-auto dash-scroll">
        {error && (
          <p className="border-b border-dash-border px-3 py-2 text-xs text-dash-amber">
            {error}
          </p>
        )}
        {loading && rows.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-dash-muted">
            Loading drone logs…
          </p>
        )}
        {!loading && rows.length === 0 && !error && (
          <p className="px-3 py-4 text-center text-xs text-dash-muted">
            No events yet. Logs appear when drone-http connects and runs commands.
          </p>
        )}
        <ul className="divide-y divide-dash-border/60 font-mono text-[11px]">
          {rows.map((e, i) => (
            <li
              key={`${e.ts_ms}-${i}`}
              className="flex gap-2 px-3 py-2 hover:bg-dash-bg/40"
            >
              <span className="shrink-0 text-dash-muted">
                {new Date(e.ts_ms).toLocaleTimeString()}
              </span>
              <span className={clsx("shrink-0 uppercase", levelClass(e.level))}>
                [{e.level}]
              </span>
              <span className="min-w-0 shrink text-dash-text">{e.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </DashboardCard>
  );
}
